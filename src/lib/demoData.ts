import rawData from '../../data/demo-case.json'
import type { ProductionReading } from '@/features/readings/types'
import type { Plant } from '@/features/plants/types'

// Readings en orden ascendente de fecha (más antigua primero)
export const demoPlant = rawData.plant as unknown as Plant
export const demoReadings = rawData.readings as unknown as ProductionReading[]
