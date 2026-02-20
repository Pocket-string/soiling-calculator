export interface Lead {
  id: string
  created_at: string
  name: string
  email: string
  location_country: string | null
  location_city: string | null
  system_kwp: number | null
  inverter_brand: string | null
  inverter_model: string | null
  reporting_frequency: 'daily' | 'weekly' | 'monthly' | null
  can_commit_weekly: boolean
  status: LeadStatus
  notes: string | null
}

export type LeadStatus = 'applied' | 'qualified' | 'invited' | 'active' | 'waitlisted' | 'rejected'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  applied: 'Postulado',
  qualified: 'Calificado',
  invited: 'Invitado',
  active: 'Activo',
  waitlisted: 'En espera',
  rejected: 'Rechazado',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  applied: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700',
  invited: 'bg-warning-100 text-warning-700',
  active: 'bg-success-100 text-success-700',
  waitlisted: 'bg-surface-alt text-foreground-secondary',
  rejected: 'bg-error-100 text-error-700',
}
