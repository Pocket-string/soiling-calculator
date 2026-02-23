'use client'

import { useTransition, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createPlant, updatePlant } from '@/actions/plants'
import type { Plant } from '@/features/plants/types'
import { CURRENCY_OPTIONS, getCurrencySymbol } from '@/lib/currency'

const LocationPicker = dynamic(
  () => import('./LocationPicker').then(m => ({ default: m.LocationPicker })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-surface-alt animate-pulse" />
        <div className="h-10 rounded-lg bg-surface-alt animate-pulse" />
        <div className="h-[300px] rounded-lg bg-surface-alt animate-pulse" />
      </div>
    ),
  }
)

const IntegrationSetup = dynamic(
  () => import('@/features/integrations/components/IntegrationSetup').then(m => ({ default: m.IntegrationSetup })),
  {
    ssr: false,
    loading: () => <div className="h-32 rounded-lg bg-surface-alt animate-pulse" />,
  }
)

interface Props {
  plant?: Plant
}

export function PlantForm({ plant }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currency, setCurrency] = useState(plant?.currency ?? 'EUR')
  const currencySymbol = getCurrencySymbol(currency)
  const [createdPlantId, setCreatedPlantId] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = plant
        ? await updatePlant(plant.id, formData)
        : await createPlant(formData)

      if (result && 'error' in result && result.error) {
        setError(
          typeof result.error === 'string'
            ? result.error
            : 'Error de validacion. Revisa los campos.'
        )
        return
      }

      // createPlant now returns { data: { id } } instead of redirect
      if (!plant && result && 'data' in result && result.data) {
        setCreatedPlantId(result.data.id)
        return
      }

      // updatePlant returns { success: true } without redirect
      if (plant) {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  // ── Step 2: Integration wizard (after plant creation) ──
  if (createdPlantId) {
    return (
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success-500 text-white text-xs font-bold">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-foreground-muted">Planta creada</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-bold">2</div>
            <span className="text-sm font-medium text-foreground">Integrar inversor</span>
          </div>
        </div>

        {/* Success message */}
        <div className="rounded-lg bg-success-50 border border-success-100 px-4 py-3 text-sm text-success-700">
          Planta creada correctamente. Ahora puedes conectar tu inversor para sincronizar lecturas automaticamente.
        </div>

        {/* Integration setup */}
        <IntegrationSetup plantId={createdPlantId} integration={null} />

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push(`/plants/${createdPlantId}`)}
            className="flex-1 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Ir al dashboard de la planta
          </button>
          <button
            type="button"
            onClick={() => router.push(`/plants/${createdPlantId}`)}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground-muted hover:bg-surface-alt transition-colors"
          >
            Omitir
          </button>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="rounded-lg bg-success-50 border border-success-100 px-4 py-3 text-sm text-success-700">
          Cambios guardados correctamente.
        </div>
      )}

      {/* SECCIÓN: Identificación */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Identificación</h2>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Nombre de la planta <span className="text-error-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            defaultValue={plant?.name}
            placeholder="Ej: Casa principal, Nave industrial..."
            required
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <LocationPicker
          defaultLatitude={plant?.latitude}
          defaultLongitude={plant?.longitude}
        />
      </section>

      {/* SECCIÓN: Módulos */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Módulos fotovoltaicos</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              N de módulos <span className="text-error-500">*</span>
            </label>
            <input
              name="num_modules"
              type="number"
              min="1"
              defaultValue={plant?.num_modules}
              placeholder="Ej: 30"
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Potencia módulo (Wp) <span className="text-error-500">*</span>
            </label>
            <input
              name="module_power_wp"
              type="number"
              step="0.1"
              defaultValue={plant?.module_power_wp}
              placeholder="Ej: 400"
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Área módulo (m2) <span className="text-error-500">*</span>
            </label>
            <input
              name="module_area_m2"
              type="number"
              step="0.01"
              defaultValue={plant?.module_area_m2}
              placeholder="Ej: 2.0"
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN: Orientación */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Orientación</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Inclinación (grados)
            </label>
            <input
              name="tilt_degrees"
              type="number"
              min="0"
              max="90"
              defaultValue={plant?.tilt_degrees ?? 30}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-foreground-muted mt-1">0 = horizontal, 90 = vertical</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Azimut (grados)
            </label>
            <input
              name="azimuth_degrees"
              type="number"
              min="0"
              max="360"
              defaultValue={plant?.azimuth_degrees ?? 180}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-foreground-muted mt-1">0 = Norte, 180 = Sur (óptimo en hemisferio norte)</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN: Parámetros técnicos */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Parámetros técnicos</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              NOCT (C)
            </label>
            <input
              name="noct"
              type="number"
              step="0.1"
              defaultValue={plant?.noct ?? 45}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-foreground-muted mt-1">Temp. nominal operación (típico 45C)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Coef. temperatura (%/C)
            </label>
            <input
              name="temp_coeff_percent"
              type="number"
              step="0.01"
              defaultValue={plant?.temp_coeff_percent ?? -0.4}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-foreground-muted mt-1">Valor negativo (típico -0.4%/C)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Eficiencia módulo
            </label>
            <input
              name="module_efficiency"
              type="number"
              step="0.001"
              min="0.01"
              max="0.5"
              defaultValue={plant?.module_efficiency ?? 0.20}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-foreground-muted mt-1">0.20 = 20% eficiencia</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN: Economía */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Parametros economicos</h2>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Moneda</label>
          <select
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 bg-surface"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Precio energia ({currencySymbol}/kWh) <span className="text-error-500">*</span>
            </label>
            <input
              name="energy_price_eur"
              type="number"
              step="0.001"
              defaultValue={plant?.energy_price_eur ?? 0.12}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Costo de limpieza ({currencySymbol}) <span className="text-error-500">*</span>
            </label>
            <input
              name="cleaning_cost_eur"
              type="number"
              step="0.5"
              defaultValue={plant?.cleaning_cost_eur ?? 150}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>
      </section>

      {/* SUBMIT */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Guardando...' : plant ? 'Guardar cambios' : 'Crear planta'}
        </button>
      </div>
    </form>
  )
}
