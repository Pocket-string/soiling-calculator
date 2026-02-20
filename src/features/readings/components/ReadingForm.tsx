'use client'

import { useTransition, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createReading } from '@/actions/readings'

type ReadingType = 'DAILY' | 'WEEKLY' | 'MONTHLY'

interface Props {
  plantId: string
  plantName: string
}

export function ReadingForm({ plantId, plantName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7) // YYYY-MM

  const [readingType, setReadingType] = useState<ReadingType>('DAILY')
  const [startDate, setStartDate] = useState(today)
  const [monthValue, setMonthValue] = useState(currentMonth)

  // Compute dates based on reading type
  const { readingDate, readingDateEnd, displayEndDate } = useMemo(() => {
    if (readingType === 'DAILY') {
      return { readingDate: startDate, readingDateEnd: undefined, displayEndDate: undefined }
    }

    if (readingType === 'WEEKLY') {
      const start = new Date(startDate + 'T12:00:00')
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const endStr = end.toISOString().split('T')[0]
      const endDisplay = end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      return { readingDate: startDate, readingDateEnd: endStr, displayEndDate: endDisplay }
    }

    // MONTHLY
    const [year, month] = monthValue.split('-').map(Number)
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0) // last day of the month
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    const endDisplay = lastDay.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    return { readingDate: firstDay, readingDateEnd: lastDayStr, displayEndDate: endDisplay }
  }, [readingType, startDate, monthValue])

  async function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('plant_id', plantId)
    formData.set('reading_type', readingType)
    formData.set('reading_date', readingDate)
    if (readingDateEnd) {
      formData.set('reading_date_end', readingDateEnd)
    }

    startTransition(async () => {
      const result = await createReading(formData)

      if ('error' in result && result.error) {
        setError(
          typeof result.error === 'string'
            ? result.error
            : 'Error de validacion. Revisa los campos.'
        )
        return
      }

      setSuccess(true)
      setTimeout(() => router.push(`/plants/${plantId}`), 1500)
    })
  }

  if (success) {
    return (
      <div className="rounded-lg bg-success-50 border border-success-100 p-8 text-center" role="status" aria-live="polite">
        <div className="text-4xl mb-3" role="img" aria-label="Completado">&#x2705;</div>
        <h3 className="text-lg font-semibold text-success-700">Lectura registrada</h3>
        <p className="text-success-600 text-sm mt-1">Calculos de soiling completados. Redirigiendo...</p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {error && (
        <div role="alert" className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* 1. Tipo de lectura (PRIMERO) */}
      <div>
        <label htmlFor="reading_type" className="block text-sm font-medium text-foreground mb-1">
          Tipo de lectura
        </label>
        <select
          id="reading_type"
          name="reading_type"
          value={readingType}
          onChange={(e) => setReadingType(e.target.value as ReadingType)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 bg-surface"
        >
          <option value="DAILY">Diaria</option>
          <option value="WEEKLY">Semanal</option>
          <option value="MONTHLY">Mensual</option>
        </select>
      </div>

      {/* 2. Fecha (dinamica segun tipo) */}
      {readingType === 'DAILY' && (
        <div>
          <label htmlFor="reading_date" className="block text-sm font-medium text-foreground mb-1">
            Fecha de la lectura <span className="text-error-500">*</span>
          </label>
          <input
            id="reading_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={today}
            required
            aria-describedby="reading_date-hint"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <p id="reading_date-hint" className="text-xs text-foreground-muted mt-1">
            El sistema obtendra automaticamente los datos de irradiancia para ese dia y ubicacion.
          </p>
        </div>
      )}

      {readingType === 'WEEKLY' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Periodo semanal <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="week_start" className="block text-xs text-foreground-muted mb-1">
                Fecha inicio
              </label>
              <input
                id="week_start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">
                Fecha fin (auto)
              </label>
              <div className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-foreground-muted">
                {displayEndDate ?? '—'}
              </div>
            </div>
          </div>
          <p className="text-xs text-foreground-muted">
            Periodo de 7 dias desde la fecha de inicio.
          </p>
        </div>
      )}

      {readingType === 'MONTHLY' && (
        <div>
          <label htmlFor="reading_month" className="block text-sm font-medium text-foreground mb-1">
            Mes de la lectura <span className="text-error-500">*</span>
          </label>
          <input
            id="reading_month"
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            max={currentMonth}
            required
            placeholder="Ej: 2026-02"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <p className="text-xs text-foreground-muted mt-1">
            Periodo: 01 — {displayEndDate ?? '—'}
          </p>
        </div>
      )}

      {/* 3. kWh reales */}
      <div>
        <label htmlFor="kwh_real" className="block text-sm font-medium text-foreground mb-1">
          Produccion real (kWh) <span className="text-error-500">*</span>
        </label>
        <input
          id="kwh_real"
          name="kwh_real"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Ej: 38.5"
          aria-describedby="kwh_real-hint"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <p id="kwh_real-hint" className="text-xs text-foreground-muted mt-1">
          Energia generada por {plantName} durante el periodo indicado.
        </p>
      </div>

      {/* 4. Dia de limpieza */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <label htmlFor="is_cleaning_day" className="flex items-start gap-3 cursor-pointer">
          <input
            id="is_cleaning_day"
            name="is_cleaning_day"
            type="checkbox"
            value="true"
            className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent-500"
          />
          <div>
            <span className="text-sm font-medium text-foreground">Se limpio hoy</span>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Marca esto si se realizo una limpieza antes de tomar la lectura.
              El sistema actualizara el baseline de rendimiento (PR limpio).
            </p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Calculando soiling...' : 'Registrar y calcular soiling'}
      </button>

      <p className="text-xs text-center text-foreground-muted">
        El calculo puede tardar unos segundos mientras se obtienen datos de irradiancia solar.
      </p>
    </form>
  )
}
