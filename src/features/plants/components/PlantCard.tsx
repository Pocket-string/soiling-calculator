import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CleaningLevelBadge } from './CleaningLevelBadge'
import type { PlantWithStats } from '@/features/plants/types'
import { getCurrencySymbol } from '@/lib/currency'

interface Props {
  plant: PlantWithStats
}

export function PlantCard({ plant }: Props) {
  const sym = getCurrencySymbol(plant.currency)
  const reading = plant.latest_reading
  const soilingPct = reading?.soiling_percent ?? null
  const prCurrent = reading?.pr_current ?? null
  const accLoss = reading?.cumulative_loss_eur ?? null

  return (
    <Link href={`/plants/${plant.id}`}>
      <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-tight">{plant.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CleaningLevelBadge level={reading?.cleaning_recommendation} soilingPercent={soilingPct} size="sm" />
            <p className="text-sm text-foreground-secondary">
              {plant.total_power_kw?.toFixed(1) ?? (plant.num_modules * plant.module_power_wp / 1000).toFixed(1)} kWp
              &nbsp;·&nbsp;
              {plant.num_modules} módulos
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Soiling"
              value={soilingPct !== null ? `${soilingPct.toFixed(1)}%` : '—'}
              danger={soilingPct !== null && soilingPct > 7}
            />
            <Stat
              label="PR actual"
              value={prCurrent !== null ? `${(prCurrent * 100).toFixed(1)}%` : '—'}
            />
            <Stat
              label="Pérdida acum."
              value={accLoss !== null ? `${accLoss.toFixed(0)}${sym}` : '—'}
              danger={accLoss !== null && accLoss > plant.cleaning_cost_eur * 0.8}
            />
          </div>
          {reading && (
            <p className="mt-3 text-xs text-foreground-muted">
              Última lectura: {new Date(reading.reading_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
          {!reading && (
            <p className="mt-3 text-xs text-foreground-muted italic">Sin lecturas aún — registra la primera</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function Stat({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${danger ? 'text-error-600' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-foreground-secondary mt-0.5">{label}</p>
    </div>
  )
}
