import type { OpenMeteoResponse, IrradianceData } from '@/features/irradiance/types'

const ARCHIVE_BASE_URL = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

/**
 * Obtiene datos de irradiancia y temperatura para una fecha y ubicación.
 * Usa el endpoint de archivo para fechas pasadas, forecast para hoy.
 */
export async function fetchDailyIrradiance(
  latitude: number,
  longitude: number,
  date: string,           // YYYY-MM-DD
  tilt_degrees: number = 30,
): Promise<IrradianceData> {
  const today = new Date().toISOString().split('T')[0]
  const isHistorical = date < today

  const baseUrl = isHistorical ? ARCHIVE_BASE_URL : FORECAST_BASE_URL

  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    start_date: date,
    end_date: date,
    daily: 'shortwave_radiation_sum,temperature_2m_max,temperature_2m_mean',
    timezone: 'auto',
  })

  const response = await fetch(`${baseUrl}?${params}`, {
    // Cache de Next.js: 1 hora para datos recientes, indefinido para histórico
    next: isHistorical
      ? { revalidate: false }
      : { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(
      `Open-Meteo API error: ${response.status} ${response.statusText} para ${date} en (${latitude}, ${longitude})`
    )
  }

  const data: OpenMeteoResponse = await response.json()

  if (!data.daily?.shortwave_radiation_sum?.length) {
    throw new Error(`Open-Meteo no devolvió datos para ${date}`)
  }

  // shortwave_radiation_sum viene en MJ/m²/día → convertir a kWh/m²/día
  const ghi_mj_m2 = data.daily.shortwave_radiation_sum[0] ?? 0
  const ghi_kwh_m2 = ghi_mj_m2 / 3.6

  // Conversión simplificada GHI → POA según inclinación
  const tiltRad = (tilt_degrees * Math.PI) / 180
  const poaFactor = 1 + Math.sin(tiltRad) * 0.15
  const poa_kwh_m2 = ghi_kwh_m2 * poaFactor

  return {
    date,
    ghi_kwh_m2,
    poa_kwh_m2,
    temp_max_c: data.daily.temperature_2m_max[0] ?? 25,
    temp_mean_c: data.daily.temperature_2m_mean[0] ?? 20,
    source: 'api',
  }
}
