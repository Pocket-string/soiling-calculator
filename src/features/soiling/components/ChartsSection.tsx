'use client'

import dynamic from 'next/dynamic'
import type { ProductionReading } from '@/features/readings/types'

// dynamic con ssr: false DEBE estar en un Client Component
const SoilingChart = dynamic(
  () => import('@/features/soiling/components/SoilingChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] flex items-center justify-center text-foreground-muted text-sm animate-pulse">
        Cargando gráficos...
      </div>
    ),
  }
)

const LossesChart = dynamic(
  () => import('@/features/soiling/components/LossesChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[160px] flex items-center justify-center text-foreground-muted text-sm animate-pulse">
        Cargando gráfico...
      </div>
    ),
  }
)

interface Props {
  readings: ProductionReading[]
  cumulativeLossEur: number | null
  energyPriceEur: number
  currencySymbol?: string
}

export function ChartsSection({ readings, cumulativeLossEur, energyPriceEur, currencySymbol = '€' }: Props) {
  if (readings.length < 2) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Soiling + PR */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Evolución del soiling</h3>
        <SoilingChart readings={readings} />
      </div>

      {/* Pérdidas económicas */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Pérdidas económicas diarias</h3>
        <LossesChart readings={readings} currencySymbol={currencySymbol} />

        <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border-light">
          <div>
            <p className="text-xs text-foreground-secondary">Pérdida acum. desde limpieza</p>
            <p className="text-base font-semibold text-foreground mt-0.5">
              {cumulativeLossEur != null ? `${cumulativeLossEur.toFixed(2)}${currencySymbol}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary">Precio energía</p>
            <p className="text-base font-semibold text-foreground mt-0.5">
              {energyPriceEur.toFixed(3)}{currencySymbol}/kWh
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
