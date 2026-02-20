import { createClient } from '@/lib/supabase/client'
import type { Plant, PlantWithStats } from '@/features/plants/types'

/**
 * Servicio de lectura para componentes cliente.
 * Las mutaciones van via Server Actions (src/actions/plants.ts).
 */
export const plantService = {
  async getAll(): Promise<PlantWithStats[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('plants')
      .select(`
        *,
        production_readings (
          reading_date,
          soiling_percent,
          cleaning_recommendation,
          pr_current,
          cumulative_loss_eur
        )
      `)
      .order('created_at', { ascending: false })
      .order('reading_date', { ascending: false, referencedTable: 'production_readings' })
      .limit(1, { referencedTable: 'production_readings' })

    if (error) throw new Error(error.message)

    return (data ?? []).map((plant) => {
      const readings = (plant as Plant & { production_readings: unknown[] }).production_readings
      const latestReading = Array.isArray(readings) && readings.length > 0
        ? readings[0] as {
            reading_date: string
            soiling_percent: number | null
            cleaning_recommendation: string | null
            pr_current: number | null
            cumulative_loss_eur: number | null
          }
        : null

      return {
        ...plant,
        latest_reading: latestReading ? {
          reading_date: latestReading.reading_date,
          soiling_percent: latestReading.soiling_percent,
          cleaning_recommendation: latestReading.cleaning_recommendation as PlantWithStats['latest_reading'] extends null | undefined ? never : NonNullable<PlantWithStats['latest_reading']>['cleaning_recommendation'],
          pr_current: latestReading.pr_current,
          cumulative_loss_eur: latestReading.cumulative_loss_eur,
        } : null,
      } as PlantWithStats
    })
  },

  async getById(id: string): Promise<Plant | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Plant
  },
}
