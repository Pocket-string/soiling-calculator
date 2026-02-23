import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { withApiAuth, apiResponse, apiError, handleCors } from '../../../_lib/helpers'
import { fetchDailyIrradiance } from '@/features/irradiance/services/openMeteoClient'
import {
  convertGhiToPoa,
  calcTheoreticalKwh,
  calcPerformanceRatio,
  calcSoilingPercent,
  calcCleaningRecommendation,
  isOutlierReading,
} from '@/features/soiling/services/soilingCalculator'
import type { Plant } from '@/features/plants/types'
import type { ProductionReading } from '@/features/readings/types'
import type { IrradianceData } from '@/features/irradiance/types'

// ── Validation schema for POST body (JSON, not FormData) ────────────────────

const createReadingSchema = z.object({
  reading_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
  kwh_real: z
    .number({ error: 'kwh_real must be a non-negative number' })
    .min(0, 'kwh_real cannot be negative'),
  reading_type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  is_cleaning_day: z.boolean().default(false),
})

type CreateReadingBody = z.infer<typeof createReadingSchema>

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Days between two YYYY-MM-DD date strings */
function daysDiffStr(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

/**
 * Fetch irradiance with service-client cache (no session cookies).
 * Falls back to Open-Meteo API if cache misses, then stores result.
 */
async function getOrFetchIrradianceService(
  latitude: number,
  longitude: number,
  date: string,
  tilt_degrees: number,
): Promise<IrradianceData> {
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${date}`
  const supabase = createServiceClient()

  // 1. Check cache
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

  // 2. Fetch from Open-Meteo
  const irradianceData = await fetchDailyIrradiance(latitude, longitude, date, tilt_degrees)

  // 3. Store in cache (historical = permanent, today = 24h TTL)
  const today = new Date().toISOString().split('T')[0]
  const isHistorical = date < today
  const expiresAt = isHistorical
    ? null
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // fire-and-forget cache write
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

// ── Route handlers ───────────────────────────────────────────────────────────

export async function OPTIONS(): Promise<Response> {
  return handleCors()
}

/**
 * GET /api/v1/plants/[id]/readings
 *
 * Query params:
 *   limit  — number of records (default 90, max 365)
 *   offset — pagination offset (default 0)
 *   from   — YYYY-MM-DD start date (inclusive)
 *   to     — YYYY-MM-DD end date (inclusive)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await withApiAuth(request, 'readings:read')
  if (auth instanceof Response) return auth

  const { id: plantId } = await params
  const supabase = createServiceClient()

  // Verify plant ownership
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('user_id', auth.userId)
    .single()

  if (plantError || !plant) return apiError('Plant not found', 404)

  // Parse query params
  const { searchParams } = new URL(request.url)
  const rawLimit = parseInt(searchParams.get('limit') ?? '90', 10)
  const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? 90 : rawLimit, 1), 365)
  const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10)
  const offset = Math.max(Number.isNaN(rawOffset) ? 0 : rawOffset, 0)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('production_readings')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', auth.userId)
    .order('reading_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (from) query = query.gte('reading_date', from)
  if (to) query = query.lte('reading_date', to)

  const { data, error } = await query

  if (error) return apiError(error.message, 500)

  return apiResponse(data)
}

/**
 * POST /api/v1/plants/[id]/readings
 *
 * Body (JSON):
 *   reading_date     — YYYY-MM-DD (required)
 *   kwh_real         — number >= 0 (required)
 *   reading_type     — 'DAILY' | 'WEEKLY' | 'MONTHLY' (default 'DAILY')
 *   is_cleaning_day  — boolean (default false)
 *
 * Runs the full soiling pipeline: irradiance → NOCT → PR → soiling →
 * trapezoidal cumulative loss → cleaning recommendation → insert.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await withApiAuth(request, 'readings:write')
  if (auth instanceof Response) return auth

  const { id: plantId } = await params

  // 1. Parse and validate JSON body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = createReadingSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(
      JSON.stringify(parsed.error.flatten().fieldErrors),
      400,
    )
  }

  const { reading_date, kwh_real, reading_type, is_cleaning_day }: CreateReadingBody = parsed.data

  const supabase = createServiceClient()

  // 2. Verify plant ownership and fetch plant config
  const { data: plantRow, error: plantError } = await supabase
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .eq('user_id', auth.userId)
    .single()

  if (plantError || !plantRow) return apiError('Plant not found', 404)

  const plant = plantRow as Plant

  // 3. Fetch irradiance (cache-first, service client variant)
  let irradianceData: IrradianceData
  try {
    irradianceData = await getOrFetchIrradianceService(
      plant.latitude,
      plant.longitude,
      reading_date,
      plant.tilt_degrees,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    return apiError(`Failed to fetch meteorological data: ${msg}`, 502)
  }

  // 4. Convert GHI → POA for NOCT model
  const { poa_kwh_m2, poa_w_m2_equivalent } = convertGhiToPoa(
    irradianceData.ghi_kwh_m2,
    plant.tilt_degrees,
  )

  // 5. Calculate theoretical kWh with NOCT model
  const noct_inputs = {
    poa_w_m2: poa_w_m2_equivalent,
    temp_ambient_c: irradianceData.temp_mean_c,
    noct: plant.noct,
    temp_coeff_percent: plant.temp_coeff_percent,
    total_power_kw: plant.total_power_kw ?? (plant.num_modules * plant.module_power_wp / 1000),
  }

  const { t_cell_c, kwh_theoretical } = calcTheoreticalKwh(noct_inputs, poa_kwh_m2)

  // 6. Performance Ratio and outlier detection
  const pr_current = calcPerformanceRatio(kwh_real, kwh_theoretical)
  const is_outlier = isOutlierReading(pr_current)

  // 7. Fetch PR baseline (last cleaning day with valid PR, before this date)
  const { data: baselineRow } = await supabase
    .from('production_readings')
    .select('pr_current')
    .eq('plant_id', plantId)
    .eq('user_id', auth.userId)
    .eq('is_cleaning_day', true)
    .lt('reading_date', reading_date)
    .not('pr_current', 'is', null)
    .gte('pr_current', 0.3)
    .lte('pr_current', 1.05)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // On a cleaning day with a valid reading, reset baseline to today's PR
  let pr_baseline: number | null = (baselineRow?.pr_current as number | null) ?? null
  if (is_cleaning_day && !is_outlier) {
    pr_baseline = pr_current
  }

  // 8. Soiling percentage
  const soiling_percent = calcSoilingPercent(pr_current, pr_baseline)

  // 9. Daily losses
  const kwh_loss = Math.max(0, kwh_theoretical - kwh_real)
  const loss_percent = kwh_theoretical > 0 ? kwh_loss / kwh_theoretical : 0
  const loss_eur = kwh_loss * plant.energy_price_eur

  // 10. Cumulative losses since last cleaning (trapezoidal interpolation for gaps)
  const { data: lastCleaningRow } = await supabase
    .from('production_readings')
    .select('reading_date')
    .eq('plant_id', plantId)
    .eq('user_id', auth.userId)
    .eq('is_cleaning_day', true)
    .lt('reading_date', reading_date)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastCleaningDate = (lastCleaningRow?.reading_date as string | null) ?? '1970-01-01'

  const { data: accRows } = await supabase
    .from('production_readings')
    .select('reading_date, kwh_loss, loss_eur')
    .eq('plant_id', plantId)
    .eq('user_id', auth.userId)
    .gt('reading_date', lastCleaningDate)
    .lt('reading_date', reading_date)
    .order('reading_date', { ascending: true })

  // Build typed rows for the trapezoidal accumulation loop
  const rows = (accRows ?? []).map((r) => ({
    date: r.reading_date as string,
    kwh_loss: (r.kwh_loss as number) ?? 0,
    loss_eur: (r.loss_eur as number) ?? 0,
  }))

  let cumulative_loss_kwh = 0
  let cumulative_loss_eur = 0

  for (let i = 0; i < rows.length; i++) {
    cumulative_loss_kwh += rows[i].kwh_loss
    cumulative_loss_eur += rows[i].loss_eur

    // Trapezoidal interpolation for gaps between consecutive readings
    if (i > 0) {
      const gapDays = daysDiffStr(rows[i - 1].date, rows[i].date) - 1
      if (gapDays > 0) {
        cumulative_loss_kwh += gapDays * (rows[i - 1].kwh_loss + rows[i].kwh_loss) / 2
        cumulative_loss_eur += gapDays * (rows[i - 1].loss_eur + rows[i].loss_eur) / 2
      }
    }
  }

  // Add current reading + interpolate gap from the last stored reading
  cumulative_loss_kwh += kwh_loss
  cumulative_loss_eur += loss_eur
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1]
    const gapDays = daysDiffStr(lastRow.date, reading_date) - 1
    if (gapDays > 0) {
      cumulative_loss_kwh += gapDays * (lastRow.kwh_loss + kwh_loss) / 2
      cumulative_loss_eur += gapDays * (lastRow.loss_eur + loss_eur) / 2
    }
  }

  // 11. Cleaning recommendation
  const { recommendation, days_to_breakeven } = calcCleaningRecommendation({
    soiling_percent,
    cumulative_loss_eur,
    cleaning_cost_eur: plant.cleaning_cost_eur,
    daily_theoretical_kwh: kwh_theoretical,
    energy_price_eur: plant.energy_price_eur,
  })

  // 12. Insert into production_readings
  const { data: reading, error: insertError } = await supabase
    .from('production_readings')
    .insert({
      plant_id: plantId,
      user_id: auth.userId,
      reading_date,
      kwh_real,
      reading_type,
      is_cleaning_day,
      // Meteorology
      irradiance_kwh_m2: irradianceData.ghi_kwh_m2,
      poa_w_m2: poa_w_m2_equivalent,
      temp_ambient_c: irradianceData.temp_mean_c,
      // NOCT
      t_cell_c,
      kwh_theoretical,
      kwh_loss,
      loss_percent,
      loss_eur,
      // PR and soiling
      pr_current,
      pr_baseline,
      soiling_percent,
      // Cumulative
      cumulative_loss_kwh,
      cumulative_loss_eur,
      // Recommendation
      cleaning_recommendation: recommendation,
      days_to_breakeven,
    })
    .select()
    .single()

  if (insertError) {
    // Unique constraint: plant_id + reading_date
    if (insertError.code === '23505') {
      return apiError('A reading already exists for this plant on that date', 409)
    }
    return apiError(insertError.message, 500)
  }

  return apiResponse(reading as ProductionReading, 201)
}
