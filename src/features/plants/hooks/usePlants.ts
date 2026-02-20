'use client'

import { useState, useEffect, useCallback } from 'react'
import { plantService } from '@/features/plants/services/plantService'
import type { PlantWithStats } from '@/features/plants/types'

export function usePlants() {
  const [plants, setPlants] = useState<PlantWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await plantService.getAll()
      setPlants(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar plantas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { plants, isLoading, error, refetch: load }
}
