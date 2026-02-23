'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/auth'
import { readingSchema } from '@/features/readings/types/schemas'
import { getOrFetchIrradiance } from '@/features/irradiance/services/irradianceService'
import { processReading } from '@/features/soiling/services/readingPipeline'
import type { Plant } from '@/features/plants/types'
import type { ProductionReading } from '@/features/readings/types'
import { track } from '@/lib/tracking'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSoilingAlertEmail } from '@/lib/email/resend'
import { serverEnv } from '@/lib/env'

export async function createReading(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Trial enforcement
  const trialError = await requireActiveSubscription(user.id)
  if (trialError) return { error: trialError }

  // 1. Validar input
  const raw = Object.fromEntries(formData)
  const parsed = readingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { plant_id, reading_date, reading_date_end: _reading_date_end, kwh_real, reading_type, is_cleaning_day } = parsed.data

  // 2. Verificar que la planta pertenece al usuario
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('*')
    .eq('id', plant_id)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) return { error: 'Planta no encontrada o sin acceso' }

  const typedPlant = plant as Plant

  // 3. Obtener irradiancia (caché → Open-Meteo)
  let irradianceData
  try {
    irradianceData = await getOrFetchIrradiance(
      typedPlant.latitude,
      typedPlant.longitude,
      reading_date,
      typedPlant.tilt_degrees
    )
  } catch (err) {
    return { error: `Error al obtener datos meteorológicos: ${err instanceof Error ? err.message : 'desconocido'}` }
  }

  // 4. Run soiling calculation pipeline → insert reading
  try {
    const result = await processReading({
      plant: typedPlant,
      userId: user.id,
      readingDate: reading_date,
      kwhReal: kwh_real,
      readingType: reading_type,
      isCleaningDay: is_cleaning_day,
      irradianceData,
      supabase,
    })

    track({ event: 'READING_CREATED', userId: user.id, metadata: { plantId: plant_id, soiling: result.soilingPercent } })

    // Fire-and-forget: check soiling alerts (never blocks response)
    if (result.soilingPercent != null && result.recommendation !== 'OK') {
      maybeSendSoilingAlert({
        userId: user.id,
        userEmail: user.email!,
        plant: typedPlant,
        soilingPercent: result.soilingPercent,
        recommendation: result.recommendation!,
        cumulativeLossEur: result.cumulativeLossEur,
        daysToBreakeven: result.daysToBreakeven,
        readingDate: reading_date,
      })
    }

    revalidatePath(`/plants/${plant_id}`)
    revalidatePath('/plants')
    return { data: result.reading as ProductionReading }
  } catch (err: unknown) {
    const pgError = err as { code?: string; message?: string }
    if (pgError.code === '23505') {
      return { error: 'Ya existe una lectura para esta planta en esa fecha' }
    }
    return { error: pgError.message ?? 'Error al crear lectura' }
  }
}

// ── Soiling Alert (fire-and-forget) ─────────────────────────────────────────

interface AlertParams {
  userId: string
  userEmail: string
  plant: Plant
  soilingPercent: number
  recommendation: string
  cumulativeLossEur: number
  daysToBreakeven: number | null
  readingDate: string
}

const COOLDOWN_HOURS = 24

async function maybeSendSoilingAlert(params: AlertParams): Promise<void> {
  try {
    const supabase = createServiceClient()

    // 1. Fetch user's notification preferences (defaults if no row)
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', params.userId)
      .maybeSingle()

    const enabled = prefs?.email_alerts_enabled ?? true
    const warningThreshold = prefs?.soiling_threshold_warning ?? 5.0
    const urgentThreshold = prefs?.soiling_threshold_urgent ?? 10.0

    // 2. Check if alerts are enabled
    if (!enabled) return

    // 3. Check if soiling exceeds threshold
    if (params.soilingPercent < warningThreshold) return

    // 4. Cooldown: skip if alert sent for this plant in last 24h
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()
    const { data: recentAlert } = await supabase
      .from('notification_log')
      .select('id')
      .eq('user_id', params.userId)
      .eq('plant_id', params.plant.id)
      .gte('sent_at', cooldownCutoff)
      .limit(1)
      .maybeSingle()

    if (recentAlert) return

    // 5. Determine alert type
    const alertType = params.soilingPercent >= urgentThreshold ? 'urgent' : 'warning'

    // 6. Send email
    const plantUrl = `${serverEnv.NEXT_PUBLIC_SITE_URL}/plants/${params.plant.id}`
    await sendSoilingAlertEmail({
      to: params.userEmail,
      plantName: params.plant.name,
      soilingPercent: params.soilingPercent,
      recommendation: params.recommendation,
      cumulativeLossEur: params.cumulativeLossEur,
      currency: params.plant.currency ?? 'EUR',
      daysToBreakeven: params.daysToBreakeven,
      readingDate: params.readingDate,
      plantUrl,
    })

    // 7. Log the alert (for cooldown)
    await supabase.from('notification_log').insert({
      user_id: params.userId,
      plant_id: params.plant.id,
      alert_type: alertType,
      soiling_percent: params.soilingPercent,
    })
  } catch (e) {
    console.warn('[alert] Soiling alert failed (non-blocking):', e)
  }
}

export async function deleteReading(readingId: string, plantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('production_readings')
    .delete()
    .eq('id', readingId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/plants/${plantId}`)
  return { success: true }
}

export async function getReadings(plantId: string, limit = 90) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'No autorizado' }

  const { data, error } = await supabase
    .from('production_readings')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .order('reading_date', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as ProductionReading[], error: null }
}
