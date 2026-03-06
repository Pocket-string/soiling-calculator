import type {
  PriorityLabel,
  UserType,
  PrimaryGoal,
  PainPoint,
  DataEntryPreference,
  FrictionTag,
  Severity,
  AgentName,
  AgentStatus,
} from './taxonomies'

// Re-export taxonomies
export * from './taxonomies'

// ============================================================
// INTERFACES — Lead Intelligence + Feedback Loop
// ============================================================

export interface LeadEnrichment {
  id: string
  lead_id: string
  fit_score: number
  activation_likelihood: number
  integration_potential: number
  urgency: number
  priority_label: PriorityLabel
  recommended_action: string
  fit_reason: string | null
  agent_version: string
  created_at: string
  updated_at: string
}

export interface OnboardingAnswers {
  id: string
  user_id: string
  user_type: UserType | null
  primary_goal: PrimaryGoal | null
  pain_point: PainPoint | null
  data_entry_preference: DataEntryPreference | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface FeedbackResponse {
  id: string
  user_id: string
  context: string
  question_key: string
  response_value: number | null
  response_text: string | null
  page_path: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface FrictionEvent {
  id: string
  user_id: string | null
  lead_id: string | null
  stage: string
  step_key: string
  friction_tag: FrictionTag
  severity: Severity
  details: Record<string, unknown>
  resolved: boolean
  created_at: string
}

export interface AgentRun {
  id: string
  agent_name: AgentName
  entity_type: string | null
  entity_id: string | null
  status: AgentStatus
  input_snapshot: Record<string, unknown>
  output_snapshot: Record<string, unknown>
  error_message: string | null
  agent_version: string
  duration_ms: number | null
  created_at: string
}
