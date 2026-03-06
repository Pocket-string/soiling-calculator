import type { Lead } from '@/features/leads/types'
import type { ScoreBreakdown } from '@/features/leads/services/leadScorer'
import type { PriorityLabel } from '../types'

// ============================================================
// LEAD TRIAGE AGENT — Pure heuristic enrichment
// ============================================================

const TIER_1_INTEGRATION = ['Huawei', 'SolarEdge'] as const
const TIER_2_INTEGRATION = ['Fronius', 'SMA'] as const
const TIER_3_INTEGRATION = ['Growatt'] as const

export interface TriageResult {
  fitScore: number
  activationLikelihood: number
  integrationPotential: number
  urgency: number
  priorityLabel: PriorityLabel
  recommendedAction: string
  fitReason: string
}

/**
 * Pure function: enriches a lead with multi-dimensional scoring.
 * No DB calls, no side effects.
 */
export function triageLead(lead: Lead, scoreBreakdown: ScoreBreakdown): TriageResult {
  const fitScore = scoreBreakdown.total

  const activationLikelihood = calcActivationLikelihood(lead)
  const integrationPotential = calcIntegrationPotential(lead)
  const urgency = calcUrgency(lead)

  const composite =
    0.4 * fitScore +
    0.3 * activationLikelihood +
    0.2 * urgency +
    0.1 * integrationPotential

  const priorityLabel = getPriorityLabel(composite)
  const fitReason = buildFitReason(lead, scoreBreakdown)
  const recommendedAction = buildRecommendedAction(priorityLabel, lead, integrationPotential)

  return {
    fitScore,
    activationLikelihood,
    integrationPotential,
    urgency,
    priorityLabel,
    recommendedAction,
    fitReason,
  }
}

// ── Activation Likelihood (0-100) ──────────────────────────

function calcActivationLikelihood(lead: Lead): number {
  let score = 0

  // Commitment is the strongest predictor (40%)
  if (lead.can_commit_weekly) score += 40

  // Daily reporters are most likely to activate (30%)
  if (lead.reporting_frequency === 'daily') score += 30
  else if (lead.reporting_frequency === 'weekly') score += 20
  else if (lead.reporting_frequency === 'monthly') score += 5

  // Larger systems = more motivation (30%)
  const kwp = lead.system_kwp ?? 0
  if (kwp >= 10) score += 30
  else if (kwp >= 5) score += 20
  else if (kwp >= 2) score += 10

  return Math.min(score, 100)
}

// ── Integration Potential (0-100) ──────────────────────────

function calcIntegrationPotential(lead: Lead): number {
  const brand = lead.inverter_brand
  if (!brand) return 0

  if ((TIER_1_INTEGRATION as readonly string[]).includes(brand)) return 100
  if ((TIER_2_INTEGRATION as readonly string[]).includes(brand)) return 60
  if ((TIER_3_INTEGRATION as readonly string[]).includes(brand)) return 40
  return 10
}

// ── Urgency (0-100) ────────────────────────────────────────

function calcUrgency(lead: Lead): number {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Fresher leads are more urgent
  let score: number
  if (daysSinceCreation <= 0) score = 100
  else if (daysSinceCreation <= 1) score = 90
  else if (daysSinceCreation <= 3) score = 70
  else if (daysSinceCreation <= 7) score = 50
  else if (daysSinceCreation <= 14) score = 30
  else score = 15

  // Commitment boost
  if (lead.can_commit_weekly) score = Math.min(score + 10, 100)

  return score
}

// ── Priority Label ─────────────────────────────────────────

function getPriorityLabel(composite: number): PriorityLabel {
  if (composite >= 75) return 'hot'
  if (composite >= 50) return 'warm'
  if (composite >= 30) return 'cool'
  return 'cold'
}

// ── Reason / Action builders ───────────────────────────────

function buildFitReason(lead: Lead, breakdown: ScoreBreakdown): string {
  const parts: string[] = []

  if (breakdown.commitment > 0) parts.push('comprometido 4 semanas')
  if (breakdown.inverter >= 25) parts.push(`inversor ${lead.inverter_brand} (Tier 1)`)
  else if (breakdown.inverter >= 15) parts.push(`inversor ${lead.inverter_brand}`)
  if (breakdown.frequency >= 20) parts.push('reporte diario')
  if (breakdown.systemSize >= 15) parts.push(`${lead.system_kwp} kWp`)
  if (breakdown.location >= 10) parts.push(`${lead.location_city}, ${lead.location_country}`)

  if (parts.length === 0) return 'Lead con datos basicos'
  return parts.join(' · ')
}

function buildRecommendedAction(
  priority: PriorityLabel,
  lead: Lead,
  integrationPotential: number
): string {
  switch (priority) {
    case 'hot': {
      const integration = integrationPotential >= 60
        ? ` con integración ${lead.inverter_brand} lista`
        : ''
      return `Invitar inmediatamente${integration}`
    }
    case 'warm':
      return 'Calificar y considerar invitación pronto'
    case 'cool':
      return 'Monitorear — puede mejorar con seguimiento'
    case 'cold':
      return 'Baja prioridad — mantener en espera'
  }
}
