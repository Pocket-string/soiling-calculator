import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createRateLimiter } from '@/lib/rate-limit'
import { decryptCredentials } from '@/features/integrations/services/crypto'
import { fetchInverterReadings } from '@/features/integrations/services/inverterClientFactory'
import { processReading } from '@/features/soiling/services/readingPipeline'
import { fetchDailyIrradiance } from '@/features/irradiance/services/openMeteoClient'
import type { Plant } from '@/features/plants/types'
import type {
  InverterProvider,
  SolarEdgeCredentials,
  HuaweiCredentials,
} from '@/features/integrations/types'
import type { IrradianceData } from '@/features/irradiance/types'

const cronLimiter = createRateLimiter(1, 5 * 60 * 1000) // 1 request per 5 min

// Max backoff: 24 hours
const MAX_BACKOFF_MS = 24 * 60 * 60 * 1000

function recordToCredentials(
  provider: InverterProvider,
  record: Record<string, string>,
): SolarEdgeCredentials | HuaweiCredentials {
  if (provider === 'solaredge') {
    return { apiKey: record.apiKey, siteId: record.siteId }
  }
  return {
    userName: record.userName,
    systemCode: record.systemCode,
    region: record.region as 'eu5' | 'intl' | 'la5',
  }
}

/**
 * Fetch irradiance using service client (no auth cookies needed).
 */
async function getIrradianceService(
  latitude: number,
  longitude: number,
  date: string,
  tilt_degrees: number,
): Promise<IrradianceData> {
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${date}`
  const supabase = createServiceClient()

  const { data: cached } = await supabase
    .from('irradiance_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .maybeSingle()

  if (cached) {
    const isExpired = cached.expires_at && new Date(cached.expires_at) < new Date()
    if (!isExpired) {
      return {
        date: cached.cache_date as string,
        ghi_kwh_m2: cached.ghi_kwh_m2 as number,
        poa_kwh_m2: (cached.poa_kwh_m2 ?? cached.ghi_kwh_m2) as number,
        temp_max_c: (cached.temp_max_c ?? 25) as number,
        temp_mean_c: (cached.temp_mean_c ?? 20) as number,
        source: 'cache',
      }
    }
  }

  const irradianceData = await fetchDailyIrradiance(latitude, longitude, date, tilt_degrees)

  const today = new Date().toISOString().split('T')[0]
  const expiresAt = date < today
    ? null
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  supabase
    .from('irradiance_cache')
    .upsert({
      cache_key: cacheKey,
      latitude,
      longitude,
      cache_date: date,
      ghi_kwh_m2: irradianceData.ghi_kwh_m2,
      poa_kwh_m2: irradianceData.poa_kwh_m2,
      temp_max_c: irradianceData.temp_max_c,
      temp_mean_c: irradianceData.temp_mean_c,
      expires_at: expiresAt,
    })
    .eq('cache_key', cacheKey)
    .then(() => {})

  return irradianceData
}

/**
 * GET /api/cron/sync-readings
 *
 * Automated sync of all active integrations with sync_enabled.
 * Protected by CRON_SECRET Bearer token.
 * Lookback: yesterday + day before yesterday (2 days).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Validate CRON_SECRET
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limit
  if (!cronLimiter('cron-sync')) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // 3. Fetch active integrations with sync enabled and no active backoff
  const { data: integrations, error: fetchError } = await supabase
    .from('inverter_integrations')
    .select('*')
    .eq('is_active', true)
    .eq('sync_enabled', true)
    .or(`next_sync_after.is.null,next_sync_after.lt.${now.toISOString()}`)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({ message: 'No integrations to sync', synced: 0 })
  }

  // 4. Date range: yesterday + day before (2-day lookback)
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const dayBefore = new Date(now)
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 2)

  const startStr = dayBefore.toISOString().split('T')[0]
  const endStr = yesterday.toISOString().split('T')[0]

  const results: Array<{
    integrationId: string
    plantId: string
    provider: string
    synced: number
    skipped: number
    errors: number
    error?: string
  }> = []

  // 5. Process each integration
  for (const integration of integrations) {
    const result = {
      integrationId: integration.id as string,
      plantId: integration.plant_id as string,
      provider: integration.provider as string,
      synced: 0,
      skipped: 0,
      errors: 0,
      error: undefined as string | undefined,
    }

    try {
      // Fetch plant
      const { data: plantRow } = await supabase
        .from('plants')
        .select('*')
        .eq('id', integration.plant_id)
        .single()

      if (!plantRow) {
        result.error = 'Plant not found'
        results.push(result)
        continue
      }

      const plant = plantRow as Plant

      // Decrypt credentials
      const credRecord = decryptCredentials(
        integration.credentials_encrypted,
        integration.credentials_iv,
        integration.credentials_tag,
      )
      const credentials = recordToCredentials(
        integration.provider as InverterProvider,
        credRecord,
      )

      // Fetch from inverter API
      const inverterReadings = await fetchInverterReadings(
        integration.provider as InverterProvider,
        credentials,
        integration.external_site_id ?? '',
        startStr,
        endStr,
      )

      // Check existing readings
      const { data: existingRows } = await supabase
        .from('production_readings')
        .select('reading_date')
        .eq('plant_id', integration.plant_id)
        .gte('reading_date', startStr)
        .lte('reading_date', endStr)

      const existingDates = new Set((existingRows ?? []).map((r) => r.reading_date))

      // Process each day
      for (const reading of inverterReadings) {
        if (existingDates.has(reading.date)) {
          result.skipped++
          continue
        }

        try {
          const irradianceData = await getIrradianceService(
            plant.latitude,
            plant.longitude,
            reading.date,
            plant.tilt_degrees,
          )

          await processReading({
            plant,
            userId: integration.user_id as string,
            readingDate: reading.date,
            kwhReal: reading.kwh_real,
            readingType: 'AUTOMATIC',
            isCleaningDay: false,
            irradianceData,
            supabase,
          })

          result.synced++
        } catch (err) {
          console.warn(`[cron] Failed ${integration.plant_id}/${reading.date}:`, err)
          result.errors++
        }
      }

      // Update sync status — success
      const status = result.errors > 0
        ? (result.synced > 0 ? 'partial' : 'error')
        : 'success'

      await supabase
        .from('inverter_integrations')
        .update({
          last_sync_at: now.toISOString(),
          last_sync_status: status,
          last_sync_error: result.errors > 0 ? `${result.errors} readings failed` : null,
          last_sync_readings_count: result.synced,
          consecutive_failures: status === 'error'
            ? ((integration.consecutive_failures as number) ?? 0) + 1
            : 0,
          next_sync_after: null,
        })
        .eq('id', integration.id)
    } catch (err) {
      // Integration-level failure: apply backoff
      const failures = ((integration.consecutive_failures as number) ?? 0) + 1
      const backoffMs = Math.min(Math.pow(2, failures) * 60 * 60 * 1000, MAX_BACKOFF_MS)
      const nextSyncAfter = new Date(now.getTime() + backoffMs).toISOString()

      result.error = err instanceof Error ? err.message : 'Unknown error'

      await supabase
        .from('inverter_integrations')
        .update({
          last_sync_at: now.toISOString(),
          last_sync_status: 'error',
          last_sync_error: result.error,
          consecutive_failures: failures,
          next_sync_after: nextSyncAfter,
        })
        .eq('id', integration.id)
    }

    results.push(result)
  }

  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0)
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)

  return NextResponse.json({
    message: `Processed ${results.length} integrations`,
    totalSynced,
    totalErrors,
    integrations: results,
  })
}
