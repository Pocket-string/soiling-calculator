import type { HuaweiCredentials, InverterDailyReading } from '../types'

/**
 * Huawei FusionSolar Northbound API client.
 *
 * Auth: session-based (POST /thirdData/login → XSRF-TOKEN cookie).
 * Rate limit: ~1 request per 30 seconds, single active session per account.
 * Session expires after 30 minutes of inactivity.
 *
 * Regional base URLs:
 * - eu5:  https://eu5.fusionsolar.huawei.com
 * - intl: https://intl.fusionsolar.huawei.com
 * - la5:  https://la5.fusionsolar.huawei.com
 */

const REGION_URLS: Record<HuaweiCredentials['region'], string> = {
  eu5: 'https://eu5.fusionsolar.huawei.com',
  intl: 'https://intl.fusionsolar.huawei.com',
  la5: 'https://la5.fusionsolar.huawei.com',
}

// Minimum delay between requests (ms)
const MIN_REQUEST_INTERVAL = 30_000
// Session considered expired after this (ms)
const SESSION_MAX_AGE = 25 * 60 * 1000 // 25 min (conservative, actual is 30)

interface HuaweiLoginResponse {
  success: boolean
  failCode: number
  data: unknown
  message?: string
}

interface HuaweiKpiResponse {
  success: boolean
  failCode: number
  data: Array<{
    collectTime: number // epoch ms
    dataItemMap: {
      inverter_power?: number    // kWh
      product_power?: number     // kWh
      reduction_total_co2?: number
      [key: string]: unknown
    }
  }>
}

interface HuaweiStationListResponse {
  success: boolean
  failCode: number
  data: {
    total: number
    list: Array<{
      stationCode: string
      stationName: string
      capacity: number // kWp
      contactPerson?: string
    }>
  }
}

class HuaweiSession {
  private xsrfToken: string | null = null
  private cookies: string[] = []
  private lastActivity = 0
  private lastRequest = 0
  private baseUrl: string

  constructor(private credentials: HuaweiCredentials) {
    this.baseUrl = REGION_URLS[credentials.region]
  }

  /** Login and establish session. */
  async login(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/thirdData/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: this.credentials.userName,
        systemCode: this.credentials.systemCode,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      throw new Error(`Huawei login HTTP error: ${res.status}`)
    }

    const data: HuaweiLoginResponse = await res.json()

    if (!data.success || data.failCode !== 0) {
      throw new Error(
        `Huawei login failed (code ${data.failCode}): ${data.message || 'Credenciales invalidas'}`,
      )
    }

    // Extract XSRF-TOKEN from Set-Cookie headers
    const setCookies = res.headers.getSetCookie?.() ?? []
    this.cookies = setCookies.map((c) => c.split(';')[0])

    const xsrfCookie = this.cookies.find((c) => c.startsWith('XSRF-TOKEN='))
    if (xsrfCookie) {
      this.xsrfToken = xsrfCookie.split('=')[1]
    }

    this.lastActivity = Date.now()
    this.lastRequest = Date.now()
  }

  /** Check if session is expired (>25 min since last activity). */
  isExpired(): boolean {
    return !this.xsrfToken || Date.now() - this.lastActivity > SESSION_MAX_AGE
  }

  /** Make an authenticated API request with rate limiting. */
  async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (this.isExpired()) {
      await this.login()
    }

    // Respect rate limit: wait if needed
    const elapsed = Date.now() - this.lastRequest
    if (elapsed < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - elapsed)
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.xsrfToken) {
      headers['XSRF-TOKEN'] = this.xsrfToken
    }
    if (this.cookies.length > 0) {
      headers['Cookie'] = this.cookies.join('; ')
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })

    this.lastRequest = Date.now()
    this.lastActivity = Date.now()

    if (!res.ok) {
      throw new Error(`Huawei API error ${res.status}: ${path}`)
    }

    const data = await res.json()
    return data as T
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Convert a YYYY-MM-DD date string to epoch milliseconds (start of day UTC).
 */
function dateToEpochMs(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getTime()
}

/**
 * Fetch daily energy production from Huawei FusionSolar.
 *
 * Uses getKpiStationDay endpoint. Returns production in kWh per day.
 * Note: due to rate limits (~1 req/30s), fetching large date ranges
 * is slow. The API accepts a single collectTime per request (one day).
 * We batch into a single call per day.
 */
export async function fetchHuaweiDaily(
  credentials: HuaweiCredentials,
  stationCode: string,
  startDate: string,
  endDate: string,
): Promise<InverterDailyReading[]> {
  const session = new HuaweiSession(credentials)
  await session.login()

  const readings: InverterDailyReading[] = []
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)

  // Iterate day by day (Huawei API needs collectTime per day)
  const current = new Date(start)
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const collectTime = dateToEpochMs(dateStr)

    try {
      const res = await session.request<HuaweiKpiResponse>(
        '/thirdData/getKpiStationDay',
        { stationCodes: stationCode, collectTime },
      )

      if (res.success && res.data?.length > 0) {
        const dayData = res.data[0]
        const kwh = dayData.dataItemMap.inverter_power
          ?? dayData.dataItemMap.product_power
          ?? null

        if (kwh != null && kwh > 0) {
          readings.push({ date: dateStr, kwh_real: kwh })
        }
      }
    } catch (err) {
      // Log but continue with other days
      console.warn(`Huawei: failed to fetch ${dateStr}:`, err)
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return readings
}

/**
 * Test connection to Huawei FusionSolar by logging in and listing stations.
 * Returns station list on success for user to select the right one.
 */
export async function testHuaweiConnection(
  credentials: HuaweiCredentials,
): Promise<{
  success: boolean
  stations?: Array<{ code: string; name: string; capacityKwp: number }>
  error?: string
}> {
  try {
    const session = new HuaweiSession(credentials)
    await session.login()

    const res = await session.request<HuaweiStationListResponse>(
      '/thirdData/getStationList',
      { pageNo: 1, pageSize: 100 },
    )

    if (!res.success) {
      return { success: false, error: `Huawei API error code: ${res.failCode}` }
    }

    return {
      success: true,
      stations: res.data.list.map((s) => ({
        code: s.stationCode,
        name: s.stationName,
        capacityKwp: s.capacity,
      })),
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexion',
    }
  }
}
