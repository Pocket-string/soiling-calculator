'use client'

import { useActionState, useState } from 'react'
import { changePassword } from '@/actions/profile'

const initialState = {
  error: null as string | null,
  success: false,
  fieldErrors: {} as Record<string, string[]>,
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && password !== confirm

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          placeholder="Mínimo 6 caracteres"
        />
        {state.fieldErrors.password && (
          <p className="text-xs text-error-500 mt-1">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium text-foreground mb-1.5">
          Confirmar contraseña
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={mismatch || undefined}
          aria-describedby={mismatch ? 'confirm-error' : undefined}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
            mismatch ? 'border-error-500' : 'border-border'
          }`}
          placeholder="Repite la contraseña"
        />
        {mismatch && (
          <p id="confirm-error" className="text-xs text-error-500 mt-1">Las contraseñas no coinciden</p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-error-600">{state.error}</p>
      )}

      {state.success && (
        <p className="text-sm text-success-600">Contraseña actualizada correctamente.</p>
      )}

      <button
        type="submit"
        disabled={isPending || mismatch || password.length < 6}
        className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Actualizando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
