import type { SolarEdgeCredentials, InverterDailyReading } from '../types'

const BASE_URL = 'https://monitoringapi.solaredge.com'

interface SolarEdgeEnergyValue {
  date: string   // "YYYY-MM-DD HH:mm:ss"
  value: number | null  // Wh
}

interface SolarEdgeEnergyResponse {
  energy: {
    timeUnit: string
    unit: string
    values: SolarEdgeEnergyValue[]
  }
}

interface SolarEdgeSiteDetails {
  details: {
    id: number
    name: string
    status: string
    peakPower: number
    currency: string
  }
}

/**
 * Fetch daily energy production from SolarEdge Monitoring API.
 *
 * API docs: https://monitoring.solaredge.com/solaredge-web/p/kits#/api
 * Rate limit: 300 requests/day per site.
 * Energy values are returned in Wh → we convert to kWh.
 */
export async function fetchSolarEdgeDaily(
  credentials: SolarEdgeCredentials,
  startDate: string,
  endDate: string,
): Promise<InverterDailyReading[]> {
  const url = new URL(`/site/${credentials.siteId}/energy`, BASE_URL)
  url.searchParams.set('timeUnit', 'DAY')
  url.searchParams.set('startDate', startDate)
  url.searchParams.set('endDate', endDate)
  url.searchParams.set('api_key', credentials.apiKey)

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SolarEdge API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data: SolarEdgeEnergyResponse = await res.json()

  return data.energy.values
    .filter((v) => v.value != null && v.value > 0)
    .map((v) => ({
      // SolarEdge returns "YYYY-MM-DD HH:mm:ss" — take date part only
      date: v.date.split(' ')[0],
      // Wh → kWh
      kwh_real: v.value! / 1000,
    }))
}

/**
 * Test connection to SolarEdge API by fetching site details.
 * Returns site name on success for user confirmation.
 */
export async function testSolarEdgeConnection(
  credentials: SolarEdgeCredentials,
): Promise<{ success: boolean; siteName?: string; error?: string }> {
  try {
    const url = new URL(`/site/${credentials.siteId}/details`, BASE_URL)
    url.searchParams.set('api_key', credentials.apiKey)

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        success: false,
        error: res.status === 403
          ? 'API key invalida o sin permisos para este sitio'
          : `Error ${res.status}: ${text.slice(0, 200)}`,
      }
    }

    const data: SolarEdgeSiteDetails = await res.json()
    return {
      success: true,
      siteName: data.details.name,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexion',
    }
  }
}
