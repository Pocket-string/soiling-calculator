'use client'

import { useState, useMemo, useTransition } from 'react'
import { createInvite } from '@/actions/invites'
import { updateLeadStatus } from '@/actions/leads'
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/features/leads/types'
import type { Lead, LeadStatus } from '@/features/leads/types'
import { calculateLeadScore } from '@/features/leads/services/leadScorer'
import { ScoreBadge } from '@/features/leads/components/ScoreBadge'
import { ScoreTooltip } from '@/features/leads/components/ScoreTooltip'
import { InlineNotesEditor } from '@/features/leads/components/InlineNotesEditor'
import { LeadsFilterBar } from '@/features/leads/components/LeadsFilterBar'
import type { StatusFilter, SortField } from '@/features/leads/components/LeadsFilterBar'

const ALL_STATUSES: LeadStatus[] = [
  'applied',
  'qualified',
  'waitlisted',
  'rejected',
]

interface Props {
  leads: Lead[]
}

export function LeadsTable({ leads: initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    id: string
    type: 'success' | 'error' | 'warning'
    msg: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')

  // Compute scores
  const leadsWithScores = useMemo(
    () =>
      leads.map((lead) => ({
        ...lead,
        scoreBreakdown: calculateLeadScore(lead),
      })),
    [leads],
  )

  // Filter + sort
  const filteredLeads = useMemo(() => {
    let result = leadsWithScores

    // Status filter
    if (statusFilter === 'scoreable') {
      result = result.filter(
        (l) => l.status === 'applied' || l.status === 'qualified',
      )
    } else if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q),
      )
    }

    // Sort
    if (sortField === 'score') {
      result = [...result].sort(
        (a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total,
      )
    }
    // 'date' keeps server order (ORDER BY created_at DESC)

    return result
  }, [leadsWithScores, statusFilter, search, sortField])

  async function handleInvite(lead: Lead) {
    const confirmed = window.confirm(
      `Invitar a ${lead.name} (${lead.email})?\n\nSe generará un enlace de invitación y recibirá un email para crear su cuenta.`,
    )
    if (!confirmed) return

    setInvitingId(lead.id)
    setFeedback(null)

    const result = await createInvite(lead.id)

    setInvitingId(null)

    if (result.error) {
      setFeedback({ id: lead.id, type: 'error', msg: result.error })
    } else {
      // Copy invite URL to clipboard
      if (result.inviteUrl) {
        try {
          await navigator.clipboard.writeText(result.inviteUrl)
        } catch {
          // Clipboard API may not be available
        }
      }

      const emailMsg = result.emailSent
        ? 'Email enviado'
        : 'Email no enviado (sin configurar Resend)'

      setFeedback({
        id: lead.id,
        type: 'success',
        msg: `Invitación creada. ${emailMsg}. URL copiada al portapapeles.`,
      })
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, status: 'invited' as LeadStatus } : l,
        ),
      )
    }
  }

  function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    startTransition(async () => {
      setFeedback(null)
      const result = await updateLeadStatus(leadId, newStatus)
      if (result.error) {
        setFeedback({ id: leadId, type: 'error', msg: result.error })
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: newStatus } : l,
          ),
        )
      }
    })
  }

  const canInvite = (status: LeadStatus) =>
    status === 'applied' || status === 'qualified'

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <LeadsFilterBar
        activeStatus={statusFilter}
        onStatusChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        sortField={sortField}
        onSortChange={setSortField}
      />

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        {/* Feedback global */}
        {feedback && (
          <div
            className={`px-4 py-3 text-sm border-b ${
              feedback.type === 'success'
                ? 'bg-success-50 text-success-700 border-success-100'
                : feedback.type === 'warning'
                  ? 'bg-warning-50 text-warning-700 border-warning-100'
                  : 'bg-error-50 text-error-700 border-error-100'
            }`}
          >
            {feedback.msg}
            <button
              onClick={() => setFeedback(null)}
              className="ml-3 underline text-xs opacity-70 hover:opacity-100"
            >
              cerrar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Nombre / Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  kWp
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Inversor
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  <button
                    onClick={() =>
                      setSortField(sortField === 'score' ? 'date' : 'score')
                    }
                    className="hover:text-foreground-secondary transition-colors"
                    title="Click para ordenar por puntaje"
                  >
                    Score {sortField === 'score' ? '▼' : ''}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Notas
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Acciones
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-alt">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-foreground-muted">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {lead.location_city && lead.location_country
                      ? `${lead.location_city}, ${lead.location_country}`
                      : lead.location_country ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-secondary font-mono">
                    {lead.system_kwp ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {lead.inverter_brand ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreTooltip breakdown={lead.scoreBreakdown}>
                      <ScoreBadge score={lead.scoreBreakdown.total} />
                    </ScoreTooltip>
                  </td>
                  <td className="px-4 py-3">
                    <InlineNotesEditor
                      leadId={lead.id}
                      initialNotes={lead.notes}
                      onSaved={(notes) =>
                        setLeads((prev) =>
                          prev.map((l) =>
                            l.id === lead.id ? { ...l, notes } : l,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[lead.status]}`}
                    >
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canInvite(lead.status) && (
                        <button
                          onClick={() => handleInvite(lead)}
                          disabled={invitingId === lead.id}
                          className="px-3 py-1.5 rounded-lg bg-success-600 text-white text-xs font-semibold hover:bg-success-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {invitingId === lead.id ? (
                            <span className="flex items-center gap-1.5">
                              <Spinner />
                              Invitando...
                            </span>
                          ) : (
                            'Invitar'
                          )}
                        </button>
                      )}
                      {lead.status !== 'active' &&
                        lead.status !== 'invited' && (
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleStatusChange(
                                lead.id,
                                e.target.value as LeadStatus,
                              )
                            }
                            disabled={isPending}
                            className="text-xs border border-border rounded px-1.5 py-1 bg-surface focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {LEAD_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        )}
                      {lead.status === 'invited' && (
                        <span className="text-xs text-blue-600 font-medium">
                          Invitado
                        </span>
                      )}
                      {lead.status === 'active' && (
                        <span className="text-xs text-success-600 font-medium">
                          Activo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted text-xs whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-foreground-muted"
                  >
                    {leads.length === 0
                      ? 'No hay postulaciones todavía.'
                      : 'Sin resultados para los filtros aplicados.'}
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

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
