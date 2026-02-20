'use client'

import { useActionState } from 'react'
import { createLead } from '@/app/(marketing)/apply/actions'

type FormState = { error: Record<string, string[]> | string | null }

const initialState: FormState = { error: null }

export function ApplyForm() {
  const [state, action, pending] = useActionState(createLead, initialState)

  return (
    <form action={action} className="space-y-5">
      {/* Datos personales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
            Nombre completo <span className="text-error-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Juan García"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <FieldError errors={fieldErrors(state, 'name')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
            Email <span className="text-error-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="juan@empresa.com"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <FieldError errors={fieldErrors(state, 'email')} />
        </div>
      </div>

      {/* Ubicación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
            País <span className="text-error-500">*</span>
          </label>
          <input
            name="location_country"
            type="text"
            required
            placeholder="España"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <FieldError errors={fieldErrors(state, 'location_country')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
            Ciudad <span className="text-error-500">*</span>
          </label>
          <input
            name="location_city"
            type="text"
            required
            placeholder="Madrid"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <FieldError errors={fieldErrors(state, 'location_city')} />
        </div>
      </div>

      {/* Instalación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
            Potencia instalada (kWp) <span className="text-error-500">*</span>
          </label>
          <input
            name="system_kwp"
            type="number"
            step="0.1"
            min="0.1"
            required
            placeholder="8.0"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <FieldError errors={fieldErrors(state, 'system_kwp')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
            Marca de inversor <span className="text-error-500">*</span>
          </label>
          <select
            name="inverter_brand"
            required
            defaultValue=""
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 bg-surface"
          >
            <option value="" disabled>
              Selecciona marca...
            </option>
            {['Huawei', 'SMA', 'Fronius', 'SolarEdge', 'Growatt', 'Otro'].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <FieldError errors={fieldErrors(state, 'inverter_brand')} />
        </div>
      </div>

      {/* Plataforma actual */}
      <div>
        <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
          App o plataforma que usas actualmente{' '}
          <span className="text-foreground-muted font-normal">(opcional)</span>
        </label>
        <input
          name="inverter_model"
          type="text"
          placeholder="FusionSolar, mySMA, Excel propio..."
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Frecuencia */}
      <div>
        <label className="block text-sm font-medium text-foreground-secondary mb-2">
          Frecuencia de registro preferida <span className="text-error-500">*</span>
        </label>
        <div className="flex gap-6">
          {[
            { value: 'daily', label: 'Diaria' },
            { value: 'weekly', label: 'Semanal' },
            { value: 'monthly', label: 'Mensual' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="reporting_frequency"
                value={value}
                required
                className="accent-primary-500"
              />
              <span className="text-sm text-foreground-secondary">{label}</span>
            </label>
          ))}
        </div>
        <FieldError errors={fieldErrors(state, 'reporting_frequency')} />
      </div>

      {/* Compromiso */}
      <div>
        <label className="block text-sm font-medium text-foreground-secondary mb-2">
          ¿Puedes comprometerte 4 semanas de monitoreo activo?{' '}
          <span className="text-error-500">*</span>
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="can_commit_weekly"
              value="true"
              required
              className="accent-primary-500"
            />
            <span className="text-sm text-foreground-secondary">Sí, puedo comprometerme</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="can_commit_weekly"
              value="false"
              className="accent-primary-500"
            />
            <span className="text-sm text-foreground-secondary">No por ahora</span>
          </label>
        </div>
      </div>

      {/* RGPD */}
      <div className="flex items-start gap-3 pt-1">
        <input
          type="checkbox"
          name="gdpr_consent"
          value="true"
          id="gdpr"
          required
          className="mt-0.5 accent-primary-500 w-4 h-4 flex-shrink-0"
        />
        <label htmlFor="gdpr" className="text-sm text-foreground-secondary cursor-pointer leading-relaxed">
          Acepto que Soiling Calc almacene mis datos para gestionar mi solicitud de acceso. No se
          comparten con terceros.
          <span className="text-error-500 ml-1">*</span>
        </label>
      </div>
      <FieldError errors={fieldErrors(state, 'gdpr_consent')} />

      {/* Error genérico */}
      {typeof state?.error === 'string' && (
        <div className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3.5 px-6 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  )
}

function fieldErrors(state: FormState, key: string): string[] | undefined {
  if (!state?.error || typeof state.error === 'string') return undefined
  return state.error[key]
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-error-600">{errors[0]}</p>
}
