import type { CleaningLevel } from '@/features/plants/types'

// ============================================================
// CONSTANTES
// ============================================================
const P_CLEAN_CLIP_FACTOR = 1.10   // Clipping al 110% de P_stc
const OUTLIER_PR_MIN = 0.30        // PR mínimo válido (< = outlier)
const OUTLIER_PR_MAX = 1.05        // PR máximo válido (> = outlier)

// Umbrales para recomendación de limpieza
const SOILING_WATCH_PCT = 3        // %
const SOILING_RECOMMENDED_PCT = 7  // %
const SOILING_URGENT_PCT = 15      // %

// ============================================================
// TIPOS INTERNOS
// ============================================================
export interface NOCTInputs {
  poa_w_m2: number           // Irradiancia en plano del módulo (W/m²)
  temp_ambient_c: number     // Temperatura ambiente (°C)
  noct: number               // Temperatura nominal de operación (°C)
  temp_coeff_percent: number // Coeficiente de temperatura (%/°C), ej: -0.4
  total_power_kw: number     // Potencia pico total instalada (kW)
}

export interface NOCTResult {
  t_cell_c: number
  kwh_theoretical: number
}

export interface CleaningAnalysisInputs {
  soiling_percent: number
  cumulative_loss_eur: number
  cleaning_cost_eur: number
  daily_theoretical_kwh: number
  energy_price_eur: number
}

export interface CleaningAnalysisResult {
  recommendation: CleaningLevel
  days_to_breakeven: number
}

// ============================================================
// FÓRMULAS PURAS (sin efectos secundarios)
// ============================================================

/**
 * Fórmula 1: Temperatura de celda (modelo NOCT)
 * T_cell = T_amb + ((NOCT - 20) / 800) * POA
 *
 * @param tempAmbient_c Temperatura ambiente en °C
 * @param noct Temperatura nominal de operación (NOCT) en °C
 * @param poa_w_m2 Irradiancia en plano del módulo en W/m²
 */
export function calcCellTemperature(
  tempAmbient_c: number,
  noct: number,
  poa_w_m2: number
): number {
  return tempAmbient_c + ((noct - 20) / 800) * poa_w_m2
}

/**
 * Fórmula 2: Potencia corregida por temperatura
 * P_temp = P_stc * (1 + (T_cell - 25) * gamma / 100)
 *
 * @param totalPowerKw Potencia nominal STC en kW
 * @param tCellC Temperatura de celda en °C
 * @param tempCoeffPercent Coeficiente de temperatura en %/°C (negativo, ej: -0.4)
 */
export function calcTempCorrectedPower(
  totalPowerKw: number,
  tCellC: number,
  tempCoeffPercent: number
): number {
  return totalPowerKw * (1 + (tCellC - 25) * (tempCoeffPercent / 100))
}

/**
 * Fórmula 3: kWh teóricos (paneles limpios)
 *
 * Método: P_clean = P_temp * (POA / 1000), con clipping al 110% de P_stc
 * kWh_theoretical = P_clean_kW * Peak_Sun_Hours
 * donde PSH = GHI en kWh/m²/día (equivalente a horas de sol pico)
 *
 * @param inputs Parámetros de la planta y meteorología
 * @param irradiance_kwh_m2 GHI diario en kWh/m²/día (Peak Sun Hours)
 */
export function calcTheoreticalKwh(
  inputs: NOCTInputs,
  irradiance_kwh_m2: number
): NOCTResult {
  const { poa_w_m2, temp_ambient_c, noct, temp_coeff_percent, total_power_kw } = inputs

  const tCell = calcCellTemperature(temp_ambient_c, noct, poa_w_m2)
  const pTempKw = calcTempCorrectedPower(total_power_kw, tCell, temp_coeff_percent)

  // Clipping: el inversor no puede superar 110% de la potencia nominal
  const pClipLimitKw = total_power_kw * P_CLEAN_CLIP_FACTOR
  const pEffKw = Math.min(pTempKw, pClipLimitKw)
  const pPositiveKw = Math.max(0, pEffKw)

  // kWh = Potencia efectiva × Horas Sol Pico (GHI en kWh/m²)
  const kwhTheoretical = pPositiveKw * irradiance_kwh_m2

  return {
    t_cell_c: tCell,
    kwh_theoretical: Math.max(0, kwhTheoretical),
  }
}

/**
 * Fórmula 4: Performance Ratio
 * PR = kWh_real / kWh_theoretical
 * Acotado entre 0 y 1.1 para detectar outliers posteriores
 */
export function calcPerformanceRatio(kwhReal: number, kwhTheoretical: number): number {
  if (kwhTheoretical <= 0) return 0
  const pr = kwhReal / kwhTheoretical
  return Math.min(Math.max(pr, 0), 1.1)
}

/**
 * Fórmula 5: Soiling %
 * Soiling = (1 - PR_current / PR_baseline) * 100
 *
 * Si no hay baseline (primer ciclo, sin limpieza previa), soiling = 0
 * No puede ser negativo (paneles más limpios que el baseline → soiling = 0)
 */
export function calcSoilingPercent(prCurrent: number, prBaseline: number | null): number {
  if (prBaseline === null || prBaseline <= 0) return 0
  const soiling = (1 - prCurrent / prBaseline) * 100
  return Math.max(0, soiling)
}

/**
 * Detección de outliers para proteger el baseline
 * Un outlier es una lectura con PR fuera del rango [0.30, 1.05]
 * (puede indicar error de medición, fallo del inversor, etc.)
 */
export function isOutlierReading(prCurrent: number): boolean {
  return prCurrent < OUTLIER_PR_MIN || prCurrent > OUTLIER_PR_MAX
}

/**
 * Análisis económico y recomendación de limpieza
 *
 * Niveles:
 * - OK:          soiling < 3%
 * - WATCH:       soiling 3-7%
 * - RECOMMENDED: soiling 7-15% O pérdida acumulada > 80% del costo de limpieza
 * - URGENT:      soiling > 15% O pérdida acumulada > 2× costo de limpieza
 *
 * Break-even: días restantes hasta que la pérdida acumulada supere el costo
 * de limpieza. Si ya lo superó, break-even = 0 (limpiar ya).
 */
export function calcCleaningRecommendation(
  inputs: CleaningAnalysisInputs
): CleaningAnalysisResult {
  const {
    soiling_percent,
    cumulative_loss_eur,
    cleaning_cost_eur,
    daily_theoretical_kwh,
    energy_price_eur,
  } = inputs

  // Pérdida diaria estimada con el soiling actual
  const daily_loss_eur = daily_theoretical_kwh * (soiling_percent / 100) * energy_price_eur
  const remaining = cleaning_cost_eur - cumulative_loss_eur
  const days_to_breakeven = remaining <= 0
    ? 0
    : daily_loss_eur > 0
      ? Math.ceil(remaining / daily_loss_eur)
      : 9999

  let recommendation: CleaningLevel

  if (soiling_percent > SOILING_URGENT_PCT || cumulative_loss_eur > cleaning_cost_eur * 2) {
    recommendation = 'URGENT'
  } else if (soiling_percent > SOILING_RECOMMENDED_PCT || cumulative_loss_eur > cleaning_cost_eur * 0.8) {
    recommendation = 'RECOMMENDED'
  } else if (soiling_percent > SOILING_WATCH_PCT) {
    recommendation = 'WATCH'
  } else {
    recommendation = 'OK'
  }

  return { recommendation, days_to_breakeven }
}

/**
 * Convierte GHI (irradiancia horizontal global) a POA (plano del módulo)
 * usando factor de conversión simplificado basado en inclinación.
 *
 * Fórmula simplificada: POA ≈ GHI * (1 + sin(tilt) * 0.2)
 * Para cálculos más precisos se debería usar el modelo de Perez completo.
 *
 * @param ghi_kwh_m2 Irradiancia horizontal global en kWh/m²
 * @param tilt_degrees Inclinación del panel en grados (0 = horizontal, 90 = vertical)
 * @returns POA en kWh/m² y en W/m² equivalente promedio
 */
export function convertGhiToPoa(
  ghi_kwh_m2: number,
  tilt_degrees: number
): { poa_kwh_m2: number; poa_w_m2_equivalent: number } {
  const tiltRad = (tilt_degrees * Math.PI) / 180
  // Factor empírico: inclinación aumenta irradiancia captada hasta ~30-35°
  const poaFactor = 1 + Math.sin(tiltRad) * 0.15
  const poa_kwh_m2 = ghi_kwh_m2 * poaFactor

  // W/m² equivalente promedio (basado en 8 horas de sol)
  const poa_w_m2_equivalent = (poa_kwh_m2 * 1000) / 8

  return { poa_kwh_m2, poa_w_m2_equivalent }
}
