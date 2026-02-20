import type { ProductionReading } from '@/features/readings/types'
import type { Plant } from '@/features/plants/types'
import { KpiCard } from '@/components/ui/kpi-card'
import { STATUS_MAP, STATUS_UNKNOWN } from '@/lib/tokens/status-map'
import { getCurrencySymbol } from '@/lib/currency'

interface Props {
  reading: ProductionReading
  plant: Plant
}

export function DemoKPIs({ reading, plant }: Props) {
  const sym = getCurrencySymbol(plant.currency)
  const level = reading.cleaning_recommendation
  const config = level ? STATUS_MAP[level] : STATUS_UNKNOWN
  const levelColor = config.badge
  const levelLabel = level ? config.label : '—'

  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Estado actual — {plant.name}</h3>
        {level && (
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${levelColor}`}>
            {levelLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Soiling actual"
          value={reading.soiling_percent !== null ? `${reading.soiling_percent.toFixed(1)}%` : '—'}
          alert={(reading.soiling_percent ?? 0) > 7}
          sub="pérdida por suciedad"
        />
        <KpiCard
          label="Perf. Ratio"
          value={reading.pr_current !== null ? `${(reading.pr_current * 100).toFixed(1)}%` : '—'}
          sub={
            reading.pr_baseline !== null
              ? `Baseline ${(reading.pr_baseline * 100).toFixed(1)}%`
              : undefined
          }
        />
        <KpiCard
          label="Pérdida acum."
          value={
            reading.cumulative_loss_eur !== null
              ? `${reading.cumulative_loss_eur.toFixed(2)}${sym}`
              : '—'
          }
          alert={(reading.cumulative_loss_eur ?? 0) > plant.cleaning_cost_eur * 0.8}
          sub={`Umbral ${(plant.cleaning_cost_eur * 0.8).toFixed(0)}${sym}`}
        />
        <KpiCard
          label="Break-even"
          value={
            reading.days_to_breakeven !== null && reading.days_to_breakeven < 9000
              ? `${reading.days_to_breakeven}d`
              : '—'
          }
          sub={`Limpieza ${plant.cleaning_cost_eur}${sym}`}
        />
      </div>

      <p className="text-xs text-foreground-muted border-t border-border-light pt-3">
        Última lectura:{' '}
        {new Date(reading.reading_date).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        &nbsp;·&nbsp;
        Instalación: {plant.total_power_kw} kWp · {plant.num_modules} módulos
      </p>
    </div>
  )
}
