export interface Plant {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  num_modules: number
  module_power_wp: number
  module_area_m2: number
  total_power_kw: number        // columna generada: num_modules * module_power_wp / 1000
  total_area_m2_calc: number    // columna generada: num_modules * module_area_m2
  tilt_degrees: number
  azimuth_degrees: number
  noct: number
  temp_coeff_percent: number
  module_efficiency: number
  energy_price_eur: number
  cleaning_cost_eur: number
  currency: string
  created_at: string
  updated_at: string
}

export interface PlantFormData {
  name: string
  latitude: number
  longitude: number
  num_modules: number
  module_power_wp: number
  module_area_m2: number
  tilt_degrees: number
  azimuth_degrees: number
  noct: number
  temp_coeff_percent: number
  module_efficiency: number
  energy_price_eur: number
  cleaning_cost_eur: number
  currency: string
}

export interface PlantWithStats extends Plant {
  latest_reading?: {
    reading_date: string
    soiling_percent: number | null
    cleaning_recommendation: CleaningLevel | null
    pr_current: number | null
    cumulative_loss_eur: number | null
  } | null
}

export type CleaningLevel = 'OK' | 'WATCH' | 'RECOMMENDED' | 'URGENT'
