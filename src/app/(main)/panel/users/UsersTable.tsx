'use client'

import { useState } from 'react'
import { sendNudgeEmail, sendBulkReengagement } from '@/actions/engagement'
import type { UserEngagement, EngagementStatus } from '@/actions/engagement'

const STATUS_CONFIG: Record<EngagementStatus, { label: string; color: string }> = {
  active: { label: 'Activo', color: 'bg-success-100 text-success-700' },
  stalled: { label: 'Estancado', color: 'bg-warning-100 text-warning-700' },
  dormant: { label: 'Dormido', color: 'bg-gray-100 text-gray-600' },
  churning: { label: 'Churning', color: 'bg-error-100 text-error-700' },
}

function trialBadgeColor(daysLeft: number | null): string {
  if (daysLeft === null) return 'text-foreground-muted'
  if (daysLeft < 7) return 'text-error-600 font-semibold'
  if (daysLeft < 14) return 'text-warning-600 font-semibold'
  return 'text-success-600'
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days}d`
}

function suggestedVariant(user: UserEngagement): 'no_plant' | 'no_readings' | 'inactive' {
  if (user.plantCount === 0) return 'no_plant'
  if (user.readingCount === 0) return 'no_readings'
  return 'inactive'
}

const VARIANT_LABELS: Record<string, string> = {
  no_plant: 'Sin planta',
  no_readings: 'Sin lecturas',
  inactive: 'Inactivo',
}

interface Props {
  users: UserEngagement[]
}

export function UsersTable({ users }: Props) {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  async function handleNudge(user: UserEngagement) {
    const variant = suggestedVariant(user)
    const confirmed = window.confirm(
      `Enviar email "${VARIANT_LABELS[variant]}" a ${user.fullName ?? user.email}?`,
    )
    if (!confirmed) return

    setSendingId(user.userId)
    setFeedback(null)

    const result = await sendNudgeEmail(user.userId, variant)

    setSendingId(null)
    if (result.error) {
      setFeedback({ type: 'error', msg: result.error })
    } else {
      setFeedback({ type: 'success', msg: `Email "${VARIANT_LABELS[variant]}" enviado a ${user.email}` })
    }
  }

  async function handleBulkReengagement() {
    if (!window.confirm('Enviar re-engagement a todos los usuarios que califican?')) return

    setBulkLoading(true)
    setFeedback(null)

    const result = await sendBulkReengagement()

    setBulkLoading(false)
    setFeedback({
      type: result.errors > 0 ? 'error' : 'success',
      msg: `${result.sent} enviados, ${result.skipped} omitidos${result.errors > 0 ? `, ${result.errors} errores` : ''}`,
    })
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-foreground-secondary">{users.length} usuarios founding</p>
        <button
          onClick={handleBulkReengagement}
          disabled={bulkLoading}
          className="px-4 py-2 rounded-lg bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 transition-colors disabled:opacity-60 w-full sm:w-auto"
        >
          {bulkLoading ? 'Enviando...' : 'Re-engagement masivo'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`px-4 py-3 text-sm rounded-lg ${
            feedback.type === 'success'
              ? 'bg-success-50 text-success-700'
              : 'bg-error-50 text-error-700'
          }`}
        >
          {feedback.msg}
          <button onClick={() => setFeedback(null)} className="ml-3 underline text-xs opacity-70">
            cerrar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Usuario
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Ultimo login
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden md:table-cell">
                  Plantas
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden md:table-cell">
                  Lecturas
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden lg:table-cell">
                  Trial
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden lg:table-cell">
                  Sistema
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map((user) => {
                const statusCfg = STATUS_CONFIG[user.engagementStatus]
                return (
                  <tr key={user.userId} className="hover:bg-surface-alt">
                    <td className="px-4 py-3 max-w-[180px] md:max-w-none">
                      <p className="font-medium text-foreground truncate">{user.fullName ?? '—'}</p>
                      <p className="text-xs text-foreground-muted truncate">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary text-xs">
                      {relativeTime(user.lastSignInAt)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono hidden md:table-cell">
                      {user.plantCount}
                    </td>
                    <td className="px-4 py-3 text-center font-mono hidden md:table-cell">
                      {user.readingCount}
                    </td>
                    <td className={`px-4 py-3 text-center text-xs hidden lg:table-cell ${trialBadgeColor(user.trialDaysLeft)}`}>
                      {user.trialDaysLeft !== null ? `${user.trialDaysLeft}d` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-foreground-secondary hidden lg:table-cell">
                      {user.systemKwp ? `${user.systemKwp} kWp` : '—'}
                      {user.inverterBrand && (
                        <span className="block text-foreground-muted">{user.inverterBrand}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.engagementStatus !== 'active' && (
                        <button
                          onClick={() => handleNudge(user)}
                          disabled={sendingId === user.userId}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 min-h-[44px]"
                        >
                          {sendingId === user.userId ? 'Enviando...' : `Nudge: ${VARIANT_LABELS[suggestedVariant(user)]}`}
                        </button>
                      )}
                      {user.engagementStatus === 'active' && (
                        <span className="text-xs text-success-600">OK</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-foreground-muted">
                    No hay usuarios founding registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
