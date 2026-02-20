'use client'

import type { LeadStatus } from '@/features/leads/types'

export type StatusFilter = 'all' | 'scoreable' | LeadStatus
export type SortField = 'date' | 'score'

interface Props {
  activeStatus: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  search: string
  onSearchChange: (search: string) => void
  sortField: SortField
  onSortChange: (sort: SortField) => void
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'scoreable', label: 'Por calificar' },
  { value: 'applied', label: 'Postulados' },
  { value: 'qualified', label: 'Calificados' },
  { value: 'invited', label: 'Invitados' },
  { value: 'active', label: 'Activos' },
  { value: 'waitlisted', label: 'En espera' },
  { value: 'rejected', label: 'Rechazados' },
]

export function LeadsFilterBar({
  activeStatus,
  onStatusChange,
  search,
  onSearchChange,
  sortField,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onStatusChange(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeStatus === value
                ? 'bg-slate-900 text-white'
                : 'bg-surface-alt text-foreground-secondary hover:bg-surface-alt/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 sm:ml-auto">
        <input
          type="search"
          placeholder="Buscar nombre o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-xs border border-border rounded-lg px-3 py-1.5 w-52 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        <button
          onClick={() => onSortChange(sortField === 'score' ? 'date' : 'score')}
          className={`text-xs px-3 py-1.5 border rounded-lg transition-colors whitespace-nowrap ${
            sortField === 'score'
              ? 'border-warning-500 bg-warning-50 text-warning-700'
              : 'border-border text-foreground-secondary hover:bg-surface-alt'
          }`}
        >
          {sortField === 'score' ? 'Ordenar: Puntaje' : 'Ordenar: Fecha'}
        </button>
      </div>
    </div>
  )
}
