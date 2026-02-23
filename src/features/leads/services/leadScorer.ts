import type { Lead } from '@/features/leads/types'

// ============================================================
// SCORING CONSTANTS
// ============================================================

const TIER_1_BRANDS = ['Huawei', 'SMA', 'Fronius', 'SolarEdge'] as const
const TIER_2_BRANDS = ['Growatt'] as const

const POINTS = {
  CAN_COMMIT_WEEKLY: 30,
  INVERTER_TIER_1: 25,
  INVERTER_TIER_2: 15,
  INVERTER_OTHER: 5,
  SYSTEM_KWP_SERIOUS: 15, // >= 5 kWp
  FREQUENCY_DAILY: 20,
  FREQUENCY_WEEKLY: 15,
  FREQUENCY_MONTHLY: 5,
  LOCATION_COMPLETE: 10,
} as const

// Max possible: 30 + 25 + 15 + 20 + 10 = 100

// ============================================================
// TYPES
// ============================================================

export interface ScoreBreakdown {
  total: number
  commitment: number
  inverter: number
  systemSize: number
  frequency: number
  location: number
}

export type ScoreTier = 'excellent' | 'good' | 'fair' | 'low'

// ============================================================
// SCORING FUNCTION
// ============================================================

/**
 * Pure function: computes a lead quality score from 0-100.
 *
 * Criteria:
 * - can_commit_weekly = true: +30
 * - inverter_brand Tier 1: +25, Tier 2: +15, Other: +5
 * - system_kwp >= 5: +15
 * - reporting_frequency daily: +20, weekly: +15, monthly: +5
 * - location_country + location_city both filled: +10
 */
type ScoringFields = Pick<Lead,
  'can_commit_weekly' | 'inverter_brand' | 'system_kwp' |
  'reporting_frequency' | 'location_country' | 'location_city'
>

export function calculateLeadScore(lead: ScoringFields): ScoreBreakdown {
  let commitment = 0
  let inverter = 0
  let systemSize = 0
  let frequency = 0
  let location = 0

  // 1. Commitment
  if (lead.can_commit_weekly) {
    commitment = POINTS.CAN_COMMIT_WEEKLY
  }

  // 2. Inverter brand
  if (lead.inverter_brand) {
    if ((TIER_1_BRANDS as readonly string[]).includes(lead.inverter_brand)) {
      inverter = POINTS.INVERTER_TIER_1
    } else if ((TIER_2_BRANDS as readonly string[]).includes(lead.inverter_brand)) {
      inverter = POINTS.INVERTER_TIER_2
    } else {
      inverter = POINTS.INVERTER_OTHER
    }
  }

  // 3. System size
  if (lead.system_kwp != null && lead.system_kwp >= 5) {
    systemSize = POINTS.SYSTEM_KWP_SERIOUS
  }

  // 4. Reporting frequency
  if (lead.reporting_frequency === 'daily') {
    frequency = POINTS.FREQUENCY_DAILY
  } else if (lead.reporting_frequency === 'weekly') {
    frequency = POINTS.FREQUENCY_WEEKLY
  } else if (lead.reporting_frequency === 'monthly') {
    frequency = POINTS.FREQUENCY_MONTHLY
  }

  // 5. Location completeness
  if (lead.location_country && lead.location_city) {
    location = POINTS.LOCATION_COMPLETE
  }

  return {
    total: commitment + inverter + systemSize + frequency + location,
    commitment,
    inverter,
    systemSize,
    frequency,
    location,
  }
}

// ============================================================
// TIER HELPERS
// ============================================================

export function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  return 'low'
}

export const SCORE_TIER_COLORS: Record<ScoreTier, string> = {
  excellent: 'text-success-700 bg-success-100',
  good: 'text-blue-700 bg-blue-100',
  fair: 'text-warning-700 bg-warning-100',
  low: 'text-foreground-secondary bg-surface-alt',
}

export const SCORE_TIER_LABELS: Record<ScoreTier, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  fair: 'Regular',
  low: 'Bajo',
}
