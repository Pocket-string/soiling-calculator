import type { ProductionReading } from '@/features/readings/types'
import { STATUS_MAP } from '@/lib/tokens/status-map'
import type { CleaningLevel } from '@/features/plants/types'

interface Props {
  readings: ProductionReading[]
}

export function DemoReadingTable({ readings }: Props) {
  const recent = [...readings].reverse().slice(0, 12)

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border-light">
        <h3 className="font-semibold text-foreground">Últimas lecturas</h3>
        <p className="text-xs text-foreground-muted mt-0.5">
          Historial reciente de la instalación demo
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                kWh real
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                kWh teórico
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                Soiling
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                PR
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {recent.map((r) => {
              const level = r.cleaning_recommendation as CleaningLevel | null
              const levelColor = level ? STATUS_MAP[level].pill : ''

              return (
                <tr
                  key={r.id}
                  className={`hover:bg-surface-alt ${r.is_cleaning_day ? 'bg-success-50/50' : ''}`}
                >
                  <td className="px-4 py-3 text-foreground-secondary font-medium whitespace-nowrap">
                    {new Date(r.reading_date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {r.is_cleaning_day && (
                      <span className="ml-1.5 text-success-600 text-xs">🧹</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-secondary font-mono">
                    {r.kwh_real.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-muted font-mono">
                    {r.kwh_theoretical !== null ? r.kwh_theoretical.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {r.soiling_percent !== null ? (
                      <span
                        className={r.soiling_percent > 7 ? 'text-error-600' : 'text-foreground'}
                      >
                        {r.soiling_percent.toFixed(1)}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-secondary font-mono">
                    {r.pr_current !== null ? `${(r.pr_current * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {level ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColor}`}
                      >
                        {STATUS_MAP[level].label}
                      </span>
                    ) : (
                      <span className="text-foreground-muted">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
