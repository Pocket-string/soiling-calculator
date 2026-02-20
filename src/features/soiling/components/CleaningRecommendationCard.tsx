import type { ProductionReading } from '@/features/readings/types'
import type { Plant } from '@/features/plants/types'
import { CleaningLevelBadge } from '@/features/plants/components'
import { KpiCard } from '@/components/ui/kpi-card'
import { STATUS_MAP } from '@/lib/tokens/status-map'
import { getCurrencySymbol } from '@/lib/currency'

interface Props {
  reading: ProductionReading | null
  plant: Plant
}

export function CleaningRecommendationCard({ reading, plant }: Props) {
  const sym = getCurrencySymbol(plant.currency)

  if (!reading) {
    return (
      <div className="rounded-lg border border-dashed border-border-dark p-6 text-center text-foreground-muted">
        <p className="text-sm">Registra al menos una lectura para ver la recomendación de limpieza.</p>
      </div>
    )
  }

  const level = reading.cleaning_recommendation
  const message = level ? STATUS_MAP[level].message : null

  return (
    <div className="rounded-lg border border-border bg-surface shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Recomendación de limpieza</h3>
        <CleaningLevelBadge level={level} soilingPercent={reading.soiling_percent} />
      </div>

      {message && (
        <p className="text-sm text-foreground-secondary">{message}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Soiling actual"
          value={reading.soiling_percent !== null ? `${reading.soiling_percent.toFixed(1)}%` : '—'}
          alert={(reading.soiling_percent ?? 0) > 7}
          icon={DustIcon}
          sub={level ? level.replace('_', ' ') : undefined}
        />
        <KpiCard
          label="Perf. Ratio"
          value={reading.pr_current !== null ? `${(reading.pr_current * 100).toFixed(1)}%` : '—'}
          icon={BoltIcon}
          sub={reading.pr_baseline !== null ? `Baseline: ${(reading.pr_baseline * 100).toFixed(1)}%` : undefined}
        />
        <KpiCard
          label="Pérdida acum."
          value={reading.cumulative_loss_eur !== null ? `${reading.cumulative_loss_eur.toFixed(2)}${sym}` : '—'}
          alert={(reading.cumulative_loss_eur ?? 0) > plant.cleaning_cost_eur * 0.8}
          icon={EuroIcon}
          sub={`Limite: ${(plant.cleaning_cost_eur * 0.8).toFixed(0)}${sym}`}
        />
        <KpiCard
          label="Break-even"
          value={reading.days_to_breakeven !== null && reading.days_to_breakeven < 9000
            ? `${reading.days_to_breakeven}d`
            : '—'}
          icon={CalendarIcon}
          sub={`Limpieza: ${plant.cleaning_cost_eur}${sym}`}
        />
      </div>

      {reading.is_cleaning_day && (
        <div className="rounded-lg bg-success-50 border border-success-100 px-3 py-2 text-xs text-success-700 flex items-center gap-2">
          <span>🧹</span>
          <span>Limpieza registrada — baseline de PR actualizado a {reading.pr_current !== null ? `${(reading.pr_current * 100).toFixed(1)}%` : '—'}</span>
        </div>
      )}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DustIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h.01M7 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function EuroIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 7.629A3 3 0 009 10.5V11h5l-1 2H9v.5a3 3 0 005.121 2.121M9 12H7m2 0H7" />
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
