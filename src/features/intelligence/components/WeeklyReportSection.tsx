'use client'

import { useState, useTransition } from 'react'
import { generateWeeklyReportAction } from '@/actions/intelligence'
import { WeeklyReportCard } from './WeeklyReportCard'
import type { WeeklyReport } from '../services/weeklyAnalyst'

interface Props {
  initialReport: WeeklyReport | null
}

export function WeeklyReportSection({ initialReport }: Props) {
  const [report, setReport] = useState<WeeklyReport | null>(initialReport)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateWeeklyReportAction()
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setReport(result.data)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Reporte Semanal</h2>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg border border-error-100">
          {error}
        </p>
      )}

      {report ? (
        <WeeklyReportCard report={report} />
      ) : (
        <p className="text-sm text-foreground-muted text-center py-8">
          No hay reporte generado. Haz clic en &ldquo;Generar Reporte&rdquo; para crear uno.
        </p>
      )}
    </div>
  )
}
