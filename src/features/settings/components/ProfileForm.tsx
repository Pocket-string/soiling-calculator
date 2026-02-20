'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/actions/profile'

interface Props {
  initialName: string | null
}

const initialState = {
  error: null as string | null,
  success: false,
  fieldErrors: {} as Record<string, string[]>,
}

export function ProfileForm({ initialName }: Props) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-1.5">
          Nombre completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={initialName ?? ''}
          required
          minLength={2}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          placeholder="Tu nombre"
        />
        {state.fieldErrors.full_name && (
          <p className="text-xs text-error-500 mt-1">{state.fieldErrors.full_name[0]}</p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-error-600">{state.error}</p>
      )}

      {state.success && (
        <p className="text-sm text-success-600">Nombre actualizado correctamente.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar nombre'}
      </button>
    </form>
  )
}
