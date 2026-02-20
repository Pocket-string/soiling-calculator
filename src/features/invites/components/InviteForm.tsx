'use client'

import { useActionState } from 'react'
import { consumeInvite } from '@/actions/invites'

interface Props {
  token: string
  defaultName: string
  email: string
}

const initialState = { error: null as string | null, fieldErrors: {} as Record<string, string[]> }

export function InviteForm({ token, defaultName, email }: Props) {
  const [state, formAction, isPending] = useActionState(consumeInvite, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {/* Email (readonly, informational) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface-alt text-foreground-muted"
        />
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-1.5">
          Nombre completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={defaultName}
          required
          minLength={2}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          placeholder="Tu nombre"
        />
        {state.fieldErrors.full_name && (
          <p className="text-xs text-error-500 mt-1">{state.fieldErrors.full_name[0]}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          placeholder="Mínimo 6 caracteres"
        />
        {state.fieldErrors.password && (
          <p className="text-xs text-error-500 mt-1">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      {/* Global error */}
      {state.error && (
        <div className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">
          {state.error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creando cuenta...' : 'Activar cuenta'}
      </button>

      <p className="text-xs text-center text-foreground-muted">
        Al activar tu cuenta, aceptas nuestros{' '}
        <a href="/terminos" className="underline hover:text-foreground-secondary">términos</a> y{' '}
        <a href="/privacidad" className="underline hover:text-foreground-secondary">privacidad</a>.
      </p>
    </form>
  )
}
