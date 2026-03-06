'use client'

import type { WeeklyReport } from '../services/weeklyAnalyst'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  report: WeeklyReport
}

const PRIORITY_COLORS = {
  high: 'bg-error-50 text-error-700 border-error-100',
  medium: 'bg-warning-50 text-warning-700 border-warning-100',
  low: 'bg-blue-50 text-blue-700 border-blue-100',
}

export function WeeklyReportCard({ report }: Props) {
  const period = `${formatDate(report.period.from)} - ${formatDate(report.period.to)}`

  return (
    <div className="space-y-4">
      <p className="text-xs text-foreground-muted">Periodo: {period}</p>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {report.funnel.steps.map((step, i) => (
              <div key={step.event} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="text-xs font-mono text-foreground-muted">
                    {report.funnel.conversionRates[i - 1]?.rate ?? 0}%
                  </span>
                )}
                <div className="rounded-full bg-surface-alt border border-border px-3 py-1.5 text-sm">
                  <span className="font-medium text-foreground-secondary">{step.label}</span>
                  <span className="ml-1.5 text-xs font-mono text-foreground-muted">{step.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Friction ranking */}
      {report.friction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Fricciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.friction.slice(0, 5).map((f) => (
                <div key={f.tag} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                  <div>
                    <span className="text-sm font-medium text-foreground">{f.tag.replace(/_/g, ' ')}</span>
                    <span className="ml-2 text-xs text-foreground-muted">
                      ({f.topSteps.join(', ')})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-foreground-muted">{f.count}x</span>
                    <SeverityDot severity={f.avgSeverity} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <MiniKpi label="Respuestas" value={report.feedback.totalResponses.toString()} />
            <MiniKpi label="Rating promedio" value={report.feedback.avgRating?.toFixed(1) ?? '-'} />
            <MiniKpi label="Onboarding completado" value={`${report.onboarding.completionRate}%`} />
          </div>

          {report.feedback.recentTexts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Comentarios recientes</p>
              {report.feedback.recentTexts.map((text, i) => (
                <p key={i} className="text-sm text-foreground-secondary italic border-l-2 border-border pl-3">
                  &ldquo;{text}&rdquo;
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvements */}
      {report.improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mejoras Priorizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.improvements.map((imp, i) => (
                <div key={i} className={`rounded-lg border p-3 ${PRIORITY_COLORS[imp.priority]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase">{imp.priority}</span>
                    <span className="text-xs opacity-70">{imp.area}</span>
                  </div>
                  <p className="text-sm font-medium">{imp.action}</p>
                  <p className="text-xs opacity-70 mt-0.5">{imp.evidence}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="text-xl font-bold font-mono text-foreground">{value}</p>
    </div>
  )
}

function SeverityDot({ severity }: { severity: number }) {
  const color = severity >= 2.5 ? 'bg-error-500' : severity >= 1.5 ? 'bg-warning-500' : 'bg-blue-500'
  return <div className={`w-2 h-2 rounded-full ${color}`} title={`Severidad: ${severity.toFixed(1)}`} />
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
