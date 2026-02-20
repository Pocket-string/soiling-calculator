import { createClient } from '@/lib/supabase/server'
import { fetchDailyIrradiance } from './openMeteoClient'
import type { IrradianceData } from '@/features/irradiance/types'

/**
 * Genera la clave de caché para evitar fragmentación.
 * Usa lat/lon redondeados a 2 decimales (precisión ~1km).
 */
function buildCacheKey(latitude: number, longitude: number, date: string): string {
  return `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${date}`
}

/**
 * Obtiene datos de irradiancia con caché en Supabase.
 *
 * Estrategia:
 * 1. Buscar en irradiance_cache
 * 2. Si existe y no expiró → devolver del caché
 * 3. Si no existe → llamar a Open-Meteo API → guardar en caché → devolver
 */
export async function getOrFetchIrradiance(
  latitude: number,
  longitude: number,
  date: string,
  tilt_degrees: number = 30
): Promise<IrradianceData> {
  const cacheKey = buildCacheKey(latitude, longitude, date)
  const supabase = await createClient()

  // 1. Buscar en caché
  const { data: cached } = await supabase
    .from('irradiance_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .maybeSingle()

  if (cached) {
    // Verificar si no expiró (si expires_at es null, es permanente)
    const isExpired = cached.expires_at && new Date(cached.expires_at) < new Date()
    if (!isExpired) {
      return {
        date: cached.cache_date,
        ghi_kwh_m2: cached.ghi_kwh_m2,
        poa_kwh_m2: cached.poa_kwh_m2 ?? cached.ghi_kwh_m2,
        temp_max_c: cached.temp_max_c ?? 25,
        temp_mean_c: cached.temp_mean_c ?? 20,
        source: 'cache',
      }
    }
  }

  // 2. Llamar a la API
  const irradianceData = await fetchDailyIrradiance(latitude, longitude, date, tilt_degrees)

  // 3. Guardar en caché
  const today = new Date().toISOString().split('T')[0]
  const isHistorical = date < today

  // Datos históricos: caché permanente. Hoy: expira en 24h
  const expiresAt = isHistorical
    ? null
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await supabase
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

  return irradianceData
}
