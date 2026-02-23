'use client'

import { useActionState } from 'react'
import { updateNotificationPreferences } from '@/actions/notifications'

interface Props {
  initialPrefs: {
    email_alerts_enabled: boolean
    soiling_threshold_warning: number
    soiling_threshold_urgent: number
  }
}

export function NotificationPreferencesForm({ initialPrefs }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => {
      return updateNotificationPreferences(formData)
    },
    { error: null },
  )

  return (
    <form action={formAction} className="space-y-4">
      {/* Toggle: email alerts enabled */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Alertas por email</p>
          <p className="text-xs text-foreground-secondary">Recibe un email cuando el soiling supere los umbrales</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="email_alerts_enabled_checkbox"
            defaultChecked={initialPrefs.email_alerts_enabled}
            className="sr-only peer"
            onChange={(e) => {
              const hidden = e.target.form?.querySelector('input[name="email_alerts_enabled"]') as HTMLInputElement
              if (hidden) hidden.value = String(e.target.checked)
            }}
          />
          <input type="hidden" name="email_alerts_enabled" defaultValue={String(initialPrefs.email_alerts_enabled)} />
          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>

      {/* Warning threshold */}
      <div className="space-y-1">
        <label htmlFor="soiling_threshold_warning" className="block text-sm font-medium text-foreground mb-1.5">
          Umbral advertencia (%)
        </label>
        <p className="text-xs text-foreground-secondary">Recibiras un aviso cuando el soiling supere este porcentaje</p>
        <input
          id="soiling_threshold_warning"
          name="soiling_threshold_warning"
          type="number"
          step="0.5"
          min="1"
          max="50"
          defaultValue={initialPrefs.soiling_threshold_warning}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      {/* Urgent threshold */}
      <div className="space-y-1">
        <label htmlFor="soiling_threshold_urgent" className="block text-sm font-medium text-foreground mb-1.5">
          Umbral urgente (%)
        </label>
        <p className="text-xs text-foreground-secondary">Recibiras una alerta urgente de limpieza al superar este porcentaje</p>
        <input
          id="soiling_threshold_urgent"
          name="soiling_threshold_urgent"
          type="number"
          step="0.5"
          min="2"
          max="50"
          defaultValue={initialPrefs.soiling_threshold_urgent}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      {state.error && (
        <p className="text-sm text-error-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar alertas'}
      </button>
    </form>
  )
}
