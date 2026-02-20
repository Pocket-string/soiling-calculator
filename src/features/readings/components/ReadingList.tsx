'use client'

import { CleaningLevelBadge } from '@/features/plants/components'
import { DeleteReadingButton } from './DeleteReadingButton'
import type { ProductionReading } from '@/features/readings/types'

interface Props {
  readings: ProductionReading[]
  plantId: string
  currencySymbol?: string
}

export function ReadingList({ readings, plantId, currencySymbol = '€' }: Props) {
  if (readings.length === 0) {
    return (
      <div className="text-center py-12 text-foreground-muted">
        <p className="text-4xl mb-3" role="img" aria-label="Sin lecturas">📋</p>
        <p className="text-sm">Sin lecturas registradas aún.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Historial de lecturas de producción</caption>
        <thead>
          <tr className="border-b border-border text-xs text-foreground-muted uppercase tracking-wide">
            <th className="pb-2 text-left font-medium">Fecha</th>
            <th className="pb-2 text-right font-medium">kWh real</th>
            <th className="pb-2 text-right font-medium">kWh teórico</th>
            <th className="pb-2 text-right font-medium">PR</th>
            <th className="pb-2 text-right font-medium">Soiling</th>
            <th className="pb-2 text-right font-medium">Perdida ({currencySymbol})</th>
            <th className="pb-2 text-right font-medium">Acum. ({currencySymbol})</th>
            <th className="pb-2 text-center font-medium">Estado</th>
            <th className="pb-2 text-center font-medium w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {readings.map((r) => {
            const isOutlier = r.pr_current !== null && (r.pr_current < 0.3 || r.pr_current > 1.05)
            return (
              <tr key={r.id} className={`hover:bg-surface-alt transition-colors ${r.is_cleaning_day ? 'bg-success-50' : ''}`}>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span>{new Date(r.reading_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    {r.is_cleaning_day && (
                      <span title="Día de limpieza" className="text-xs" role="img" aria-label="Día de limpieza">🧹</span>
                    )}
                    {isOutlier && (
                      <span title="Lectura atípica — no afecta al baseline" className="text-xs text-warning-600" role="img" aria-label="Lectura atípica">⚠️</span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-right font-mono">
                  {r.kwh_real?.toFixed(1)}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-foreground-muted">
                  {r.kwh_theoretical?.toFixed(1) ?? '—'}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono">
                  {r.pr_current !== null ? `${(r.pr_current * 100).toFixed(1)}%` : '—'}
                </td>
                <td className={`py-2.5 pr-4 text-right font-mono font-medium ${(r.soiling_percent ?? 0) > 7 ? 'text-error-600' : (r.soiling_percent ?? 0) > 3 ? 'text-warning-600' : 'text-foreground-secondary'}`}>
                  {r.soiling_percent !== null ? `${r.soiling_percent.toFixed(1)}%` : '—'}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-error-600">
                  {r.loss_eur !== null ? `${r.loss_eur.toFixed(2)}${currencySymbol}` : '—'}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono">
                  {r.cumulative_loss_eur !== null ? `${r.cumulative_loss_eur.toFixed(2)}${currencySymbol}` : '—'}
                </td>
                <td className="py-2.5 text-center">
                  <CleaningLevelBadge level={r.cleaning_recommendation} soilingPercent={r.soiling_percent} size="sm" />
                </td>
                <td className="py-2.5 text-center">
                  <DeleteReadingButton
                    readingId={r.id}
                    plantId={plantId}
                    readingDate={new Date(r.reading_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
