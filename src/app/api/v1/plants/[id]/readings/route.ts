import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { withApiAuth, apiResponse, apiError, handleCors } from '../../../_lib/helpers'
import { fetchDailyIrradiance } from '@/features/irradiance/services/openMeteoClient'
import { processReading } from '@/features/soiling/services/readingPipeline'
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

  // 4. Run soiling calculation pipeline → insert reading
  try {
    const result = await processReading({
      plant,
      userId: auth.userId,
      readingDate: reading_date,
      kwhReal: kwh_real,
      readingType: reading_type,
      isCleaningDay: is_cleaning_day,
      irradianceData,
      supabase,
    })

    return apiResponse(result.reading as ProductionReading, 201)
  } catch (err: unknown) {
    const pgError = err as { code?: string; message?: string }
    if (pgError.code === '23505') {
      return apiError('A reading already exists for this plant on that date', 409)
    }
    return apiError(pgError.message ?? 'Failed to create reading', 500)
  }
}
