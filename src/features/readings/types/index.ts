import type { CleaningLevel } from '@/features/plants/types'

export interface ProductionReading {
  id: string
  plant_id: string
  user_id: string
  reading_date: string
  kwh_real: number
  reading_type: ReadingType
  is_cleaning_day: boolean

  // Datos meteorológicos
  irradiance_kwh_m2: number | null
  poa_w_m2: number | null
  temp_ambient_c: number | null

  // Cálculos NOCT
  t_cell_c: number | null
  kwh_theoretical: number | null
  kwh_loss: number | null
  loss_percent: number | null
  loss_eur: number | null

  // Performance Ratio y soiling
  pr_current: number | null
  pr_baseline: number | null
  soiling_percent: number | null

  // Acumulados desde última limpieza
  cumulative_loss_kwh: number | null
  cumulative_loss_eur: number | null

  // Recomendación
  cleaning_recommendation: CleaningLevel | null
  days_to_breakeven: number | null

  created_at: string
}

export type ReadingType = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface ReadingFormData {
  plant_id: string
  reading_date: string
  kwh_real: number
  reading_type: ReadingType
  is_cleaning_day: boolean
}
