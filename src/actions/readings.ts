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
  // Obtener fecha de última limpieza
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
    .select('kwh_loss, loss_eur')
    .eq('plant_id', plant_id)
    .gt('reading_date', lastCleaningDate)
    .lt('reading_date', reading_date)

  const cumulative_loss_kwh = (accRows ?? []).reduce((sum, r) => sum + (r.kwh_loss ?? 0), 0)
  const cumulative_loss_eur_prev = (accRows ?? []).reduce((sum, r) => sum + (r.loss_eur ?? 0), 0)
  const cumulative_loss_eur = cumulative_loss_eur_prev + loss_eur

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

  revalidatePath(`/plants/${plant_id}`)
  revalidatePath('/plants')
  return { data: reading as ProductionReading }
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
