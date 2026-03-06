// ============================================================
// TAXONOMIAS CERRADAS — Lead Intelligence + Feedback Loop
// ============================================================

export const USER_TYPES = [
  { value: 'owner', label: 'Dueño de sistema FV' },
  { value: 'installer', label: 'Instalador / Integrador' },
  { value: 'operator', label: 'Operador / Técnico' },
  { value: 'other', label: 'Otro' },
] as const

export type UserType = (typeof USER_TYPES)[number]['value']

export const PRIMARY_GOALS = [
  { value: 'monitor_performance', label: 'Monitorear rendimiento' },
  { value: 'optimize_cleaning', label: 'Optimizar limpieza' },
  { value: 'report_to_clients', label: 'Reportar a clientes' },
  { value: 'explore_tool', label: 'Explorar la herramienta' },
] as const

export type PrimaryGoal = (typeof PRIMARY_GOALS)[number]['value']

export const PAIN_POINTS = [
  { value: 'underperformance_suspected', label: 'Sospecho bajo rendimiento' },
  { value: 'cleaning_roi_unclear', label: 'ROI de limpieza no claro' },
  { value: 'manual_tracking_hard', label: 'Seguimiento manual difícil' },
  { value: 'client_reporting_need', label: 'Necesito reportar a clientes' },
  { value: 'just_exploring', label: 'Solo explorando' },
] as const

export type PainPoint = (typeof PAIN_POINTS)[number]['value']

export const DATA_ENTRY_PREFERENCES = [
  { value: 'manual', label: 'Manual (una por una)' },
  { value: 'csv', label: 'CSV / Excel' },
  { value: 'integration', label: 'Integración automática' },
  { value: 'unknown', label: 'No sé aún' },
] as const

export type DataEntryPreference = (typeof DATA_ENTRY_PREFERENCES)[number]['value']

export const FRICTION_TAGS = [
  { value: 'location_confusion', label: 'Confusión con ubicación' },
  { value: 'plant_setup_too_long', label: 'Configuración de planta larga' },
  { value: 'reading_source_unknown', label: 'Fuente de lectura desconocida' },
  { value: 'cleaning_day_confusion', label: 'Confusión día de limpieza' },
  { value: 'trust_in_result_low', label: 'Baja confianza en resultados' },
  { value: 'invite_link_issue', label: 'Problema con enlace de invitación' },
  { value: 'password_issue', label: 'Problema con contraseña' },
  { value: 'abandoned_apply', label: 'Abandono de postulación' },
  { value: 'unknown', label: 'Desconocido' },
] as const

export type FrictionTag = (typeof FRICTION_TAGS)[number]['value']

export const PRIORITY_LABELS = [
  { value: 'hot', label: 'Hot', color: 'text-error-700 bg-error-50 border-error-100' },
  { value: 'warm', label: 'Warm', color: 'text-warning-700 bg-warning-50 border-warning-100' },
  { value: 'cool', label: 'Cool', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'cold', label: 'Cold', color: 'text-foreground-muted bg-surface-alt border-border' },
] as const

export type PriorityLabel = (typeof PRIORITY_LABELS)[number]['value']

export const SEVERITY_LEVELS = ['low', 'medium', 'high'] as const
export type Severity = (typeof SEVERITY_LEVELS)[number]

export const AGENT_NAMES = ['lead_triage', 'activation_concierge', 'weekly_analyst'] as const
export type AgentName = (typeof AGENT_NAMES)[number]

export const AGENT_STATUSES = ['running', 'completed', 'failed'] as const
export type AgentStatus = (typeof AGENT_STATUSES)[number]
