import type { SupabaseClient } from '@supabase/supabase-js'
import type { Plant } from '@/features/plants/types'
import type { ProductionReading, ReadingType } from '@/features/readings/types'
import type { IrradianceData } from '@/features/irradiance/types'
import type { CleaningLevel } from '@/features/plants/types'
import {
  calcTheoreticalKwh,
  calcPerformanceRatio,
  calcSoilingPercent,
  calcCleaningRecommendation,
  isOutlierReading,
  convertGhiToPoa,
} from './soilingCalculator'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReadingPipelineInput {
  plant: Plant
  userId: string
  readingDate: string
  kwhReal: number
  readingType: ReadingType
  isCleaningDay: boolean
  irradianceData: IrradianceData
  supabase: SupabaseClient
}

export interface ReadingPipelineResult {
  reading: ProductionReading
  soilingPercent: number | null
  recommendation: CleaningLevel | null
  cumulativeLossEur: number
  daysToBreakeven: number | null
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Days between two YYYY-MM-DD date strings */
function daysDiffStr(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

// ── Pipeline ────────────────────────────────────────────────────────────────

/**
 * Full soiling calculation pipeline: irradiance → GHI→POA → NOCT → PR →
 * baseline → soiling% → trapezoidal cumulative loss → recommendation → INSERT.
 *
 * Caller is responsible for:
 * - Authentication & authorization
 * - Fetching the plant (with ownership check)
 * - Fetching irradiance data (cache strategy depends on context)
 * - Error formatting (server action vs API response vs cron log)
 *
 * @throws Error on insert failure (including duplicate detection)
 */
export async function processReading(
  input: ReadingPipelineInput,
): Promise<ReadingPipelineResult> {
  const {
    plant, userId, readingDate, kwhReal,
    readingType, isCleaningDay, irradianceData, supabase,
  } = input

  // 1. Convert GHI → POA
  const { poa_kwh_m2, poa_w_m2_equivalent } = convertGhiToPoa(
    irradianceData.ghi_kwh_m2,
    plant.tilt_degrees,
  )

  // 2. Calculate theoretical kWh with NOCT model
  const totalPowerKw = plant.total_power_kw
    ?? (plant.num_modules * plant.module_power_wp / 1000)

  const { t_cell_c, kwh_theoretical } = calcTheoreticalKwh(
    {
      poa_w_m2: poa_w_m2_equivalent,
      temp_ambient_c: irradianceData.temp_mean_c,
      noct: plant.noct,
      temp_coeff_percent: plant.temp_coeff_percent,
      total_power_kw: totalPowerKw,
    },
    poa_kwh_m2,
  )

  // 3. Performance Ratio and outlier detection
  const pr_current = calcPerformanceRatio(kwhReal, kwh_theoretical)
  const is_outlier = isOutlierReading(pr_current)

  // 4. Fetch PR baseline (last cleaning day with valid PR, before this date)
  const { data: baselineRow } = await supabase
    .from('production_readings')
    .select('pr_current')
    .eq('plant_id', plant.id)
    .eq('is_cleaning_day', true)
    .lt('reading_date', readingDate)
    .not('pr_current', 'is', null)
    .gte('pr_current', 0.3)
    .lte('pr_current', 1.05)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // On a cleaning day with a valid reading, reset baseline to today's PR
  let pr_baseline: number | null = (baselineRow?.pr_current as number | null) ?? null
  if (isCleaningDay && !is_outlier) {
    pr_baseline = pr_current
  }

  // 5. Soiling percentage
  const soiling_percent = calcSoilingPercent(pr_current, pr_baseline)

  // 6. Daily losses
  const kwh_loss = Math.max(0, kwh_theoretical - kwhReal)
  const loss_percent = kwh_theoretical > 0 ? kwh_loss / kwh_theoretical : 0
  const loss_eur = kwh_loss * plant.energy_price_eur

  // 7. Cumulative losses since last cleaning (trapezoidal interpolation)
  const { data: lastCleaningRow } = await supabase
    .from('production_readings')
    .select('reading_date')
    .eq('plant_id', plant.id)
    .eq('is_cleaning_day', true)
    .lt('reading_date', readingDate)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastCleaningDate = (lastCleaningRow?.reading_date as string | null) ?? '1970-01-01'

  const { data: accRows } = await supabase
    .from('production_readings')
    .select('reading_date, kwh_loss, loss_eur')
    .eq('plant_id', plant.id)
    .gt('reading_date', lastCleaningDate)
    .lt('reading_date', readingDate)
    .order('reading_date', { ascending: true })

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
    const gapDays = daysDiffStr(lastRow.date, readingDate) - 1
    if (gapDays > 0) {
      cumulative_loss_kwh += gapDays * (lastRow.kwh_loss + kwh_loss) / 2
      cumulative_loss_eur += gapDays * (lastRow.loss_eur + loss_eur) / 2
    }
  }

  // 8. Cleaning recommendation
  const { recommendation, days_to_breakeven } = calcCleaningRecommendation({
    soiling_percent,
    cumulative_loss_eur,
    cleaning_cost_eur: plant.cleaning_cost_eur,
    daily_theoretical_kwh: kwh_theoretical,
    energy_price_eur: plant.energy_price_eur,
  })

  // 9. Insert into production_readings
  const { data: reading, error: insertError } = await supabase
    .from('production_readings')
    .insert({
      plant_id: plant.id,
      user_id: userId,
      reading_date: readingDate,
      kwh_real: kwhReal,
      reading_type: readingType,
      is_cleaning_day: isCleaningDay,
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
    throw insertError
  }

  return {
    reading: reading as ProductionReading,
    soilingPercent: soiling_percent,
    recommendation,
    cumulativeLossEur: cumulative_loss_eur,
    daysToBreakeven: days_to_breakeven,
  }
}
