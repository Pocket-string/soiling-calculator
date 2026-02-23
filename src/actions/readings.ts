'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/auth'
import { readingSchema } from '@/features/readings/types/schemas'
import { getOrFetchIrradiance } from '@/features/irradiance/services/irradianceService'
import {
  calcTheoreticalKwh,
  calcPerformanceRatio,
  calcSoilingPercent,
  calcCleaningRecommendation,
  isOutlierReading,
  convertGhiToPoa,
} from '@/features/soiling/services/soilingCalculator'
import type { Plant } from '@/features/plants/types'
import type { ProductionReading } from '@/features/readings/types'
import { track } from '@/lib/tracking'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSoilingAlertEmail } from '@/lib/email/resend'
import { serverEnv } from '@/lib/env'

/** Days between two YYYY-MM-DD date strings */
function daysDiffStr(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db.getTime() - da.getTime()) / (86_400_000))
}

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

  // 4. Convertir GHI → POA en W/m² equivalente para el modelo NOCT
  const { poa_kwh_m2, poa_w_m2_equivalent } = convertGhiToPoa(
    irradianceData.ghi_kwh_m2,
    typedPlant.tilt_degrees
  )

  // 5. Calcular kWh teóricos con modelo NOCT
  const noct_inputs = {
    poa_w_m2: poa_w_m2_equivalent,
    temp_ambient_c: irradianceData.temp_mean_c,
    noct: typedPlant.noct,
    temp_coeff_percent: typedPlant.temp_coeff_percent,
    total_power_kw: typedPlant.total_power_kw ?? (typedPlant.num_modules * typedPlant.module_power_wp / 1000),
  }

  const { t_cell_c, kwh_theoretical } = calcTheoreticalKwh(noct_inputs, poa_kwh_m2)

  // 6. Performance Ratio actual
  const pr_current = calcPerformanceRatio(kwh_real, kwh_theoretical)
  const is_outlier = isOutlierReading(pr_current)

  // 7. Obtener baseline de PR (último día con is_cleaning_day = TRUE, no outlier)
  // supabase (con auth del usuario) es suficiente — RLS filtra por user_id
  const { data: baselineRow } = await supabase
    .from('production_readings')
    .select('pr_current')
    .eq('plant_id', plant_id)
    .eq('is_cleaning_day', true)
    .lt('reading_date', reading_date)
    .not('pr_current', 'is', null)
    .gte('pr_current', 0.3)
    .lte('pr_current', 1.05)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Si es día de limpieza, el baseline se resetea con el PR de hoy (si no es outlier)
  let pr_baseline: number | null = baselineRow?.pr_current ?? null
  if (is_cleaning_day && !is_outlier) {
    pr_baseline = pr_current
  }

  // 8. Calcular soiling %
  const soiling_percent = calcSoilingPercent(pr_current, pr_baseline)

  // 9. Pérdidas del día
  const kwh_loss = Math.max(0, kwh_theoretical - kwh_real)
  const loss_percent = kwh_theoretical > 0 ? kwh_loss / kwh_theoretical : 0
  const loss_eur = kwh_loss * typedPlant.energy_price_eur

  // 10. Pérdidas acumuladas desde última limpieza
  // Usa interpolación trapezoidal para estimar pérdidas en días sin lectura
  const { data: lastCleaningRow } = await supabase
    .from('production_readings')
    .select('reading_date')
    .eq('plant_id', plant_id)
    .eq('is_cleaning_day', true)
    .lt('reading_date', reading_date)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastCleaningDate = lastCleaningRow?.reading_date ?? '1970-01-01'

  const { data: accRows } = await supabase
    .from('production_readings')
    .select('reading_date, kwh_loss, loss_eur')
    .eq('plant_id', plant_id)
    .gt('reading_date', lastCleaningDate)
    .lt('reading_date', reading_date)
    .order('reading_date', { ascending: true })

  // Trapezoidal interpolation: for gaps between readings,
  // estimate daily loss as linear interpolation between neighbors
  const rows = (accRows ?? []).map(r => ({
    date: r.reading_date as string,
    kwh_loss: (r.kwh_loss as number) ?? 0,
    loss_eur: (r.loss_eur as number) ?? 0,
  }))

  let cumulative_loss_kwh = 0
  let cumulative_loss_eur = 0

  for (let i = 0; i < rows.length; i++) {
    cumulative_loss_kwh += rows[i].kwh_loss
    cumulative_loss_eur += rows[i].loss_eur
    // Interpolate gap between consecutive readings
    if (i > 0) {
      const gapDays = daysDiffStr(rows[i - 1].date, rows[i].date) - 1
      if (gapDays > 0) {
        cumulative_loss_kwh += gapDays * (rows[i - 1].kwh_loss + rows[i].kwh_loss) / 2
        cumulative_loss_eur += gapDays * (rows[i - 1].loss_eur + rows[i].loss_eur) / 2
      }
    }
  }

  // Add current reading + interpolate gap from last previous reading
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

  // 11. Recomendación de limpieza
  const { recommendation, days_to_breakeven } = calcCleaningRecommendation({
    soiling_percent,
    cumulative_loss_eur,
    cleaning_cost_eur: typedPlant.cleaning_cost_eur,
    daily_theoretical_kwh: kwh_theoretical,
    energy_price_eur: typedPlant.energy_price_eur,
  })

  // 12. Insertar en production_readings
  const { data: reading, error: insertError } = await supabase
    .from('production_readings')
    .insert({
      plant_id,
      user_id: user.id,
      reading_date,
      kwh_real,
      reading_type,
      is_cleaning_day,
      // Meteorología
      irradiance_kwh_m2: irradianceData.ghi_kwh_m2,
      poa_w_m2: poa_w_m2_equivalent,
      temp_ambient_c: irradianceData.temp_mean_c,
      // NOCT
      t_cell_c,
      kwh_theoretical,
      kwh_loss,
      loss_percent,
      loss_eur,
      // PR y soiling
      pr_current,
      pr_baseline,
      soiling_percent,
      // Acumulados
      cumulative_loss_kwh,
      cumulative_loss_eur,
      // Recomendación
      cleaning_recommendation: recommendation,
      days_to_breakeven,
    })
    .select()
    .single()

  if (insertError) {
    // Detectar duplicado (unique constraint plant_id + reading_date)
    if (insertError.code === '23505') {
      return { error: 'Ya existe una lectura para esta planta en esa fecha' }
    }
    return { error: insertError.message }
  }

  track({ event: 'READING_CREATED', userId: user.id, metadata: { plantId: plant_id, soiling: soiling_percent } })

  // Fire-and-forget: check soiling alerts (never blocks response)
  if (soiling_percent != null && recommendation !== 'OK') {
    maybeSendSoilingAlert({
      userId: user.id,
      userEmail: user.email!,
      plant: typedPlant,
      soilingPercent: soiling_percent,
      recommendation,
      cumulativeLossEur: cumulative_loss_eur,
      daysToBreakeven: days_to_breakeven,
      readingDate: reading_date,
    })
  }

  revalidatePath(`/plants/${plant_id}`)
  revalidatePath('/plants')
  return { data: reading as ProductionReading }
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
