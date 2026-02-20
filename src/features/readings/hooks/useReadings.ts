'use client'

import { useState, useEffect, useCallback } from 'react'
import { readingService } from '@/features/readings/services/readingService'
import type { ProductionReading } from '@/features/readings/types'

export function useReadings(plantId: string, limit = 90) {
  const [readings, setReadings] = useState<ProductionReading[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await readingService.getByPlant(plantId, limit)
      setReadings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar lecturas')
    } finally {
      setIsLoading(false)
    }
  }, [plantId, limit])

  useEffect(() => {
    load()
  }, [load])

  return { readings, isLoading, error, refetch: load }
}
