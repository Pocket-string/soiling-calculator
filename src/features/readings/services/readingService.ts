import { createClient } from '@/lib/supabase/client'
import type { ProductionReading } from '@/features/readings/types'

export const readingService = {
  async getByPlant(plantId: string, limit = 90): Promise<ProductionReading[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('production_readings')
      .select('*')
      .eq('plant_id', plantId)
      .order('reading_date', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return (data ?? []) as ProductionReading[]
  },

  async getLatest(plantId: string): Promise<ProductionReading | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('production_readings')
      .select('*')
      .eq('plant_id', plantId)
      .order('reading_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return null
    return data as ProductionReading | null
  },
}
