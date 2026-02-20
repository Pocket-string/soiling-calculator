export interface IrradianceData {
  date: string
  ghi_kwh_m2: number    // Irradiancia global horizontal en kWh/m²/día
  poa_kwh_m2: number    // Irradiancia en plano del módulo en kWh/m²/día
  temp_max_c: number    // Temperatura máxima del día (°C)
  temp_mean_c: number   // Temperatura media del día (°C)
  source: 'cache' | 'api'
}

export interface OpenMeteoResponse {
  daily: {
    time: string[]
    shortwave_radiation_sum: number[]    // MJ/m²/día → dividir por 3.6 para kWh/m²
    temperature_2m_max: number[]
    temperature_2m_mean: number[]
  }
}
