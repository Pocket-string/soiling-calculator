import { createServiceClient } from '@/lib/supabase/server'
import type { FrictionTag, Severity } from '../types'

// ============================================================
// WEEKLY PRODUCT ANALYST — Heuristic report (no LLM)
// ============================================================

export interface WeeklyReport {
  period: { from: string; to: string }
  funnel: FunnelMetrics
  friction: FrictionSummary[]
  feedback: FeedbackSummary
  onboarding: OnboardingSummary
  improvements: Improvement[]
  generatedAt: string
}

export interface FunnelMetrics {
  steps: Array<{ event: string; label: string; count: number }>
  conversionRates: Array<{ from: string; to: string; rate: number }>
}

export interface FrictionSummary {
  tag: FrictionTag
  count: number
  avgSeverity: number
  topSteps: string[]
}

export interface FeedbackSummary {
  totalResponses: number
  avgRating: number | null
  byContext: Array<{ context: string; count: number; avgRating: number | null }>
  recentTexts: string[]
}

export interface OnboardingSummary {
  totalStarted: number
  totalCompleted: number
  completionRate: number
  topUserType: string | null
  topGoal: string | null
}

export interface Improvement {
  priority: 'high' | 'medium' | 'low'
  area: string
  action: string
  evidence: string
}

const FUNNEL_ORDER = [
  { event: 'LEAD_APPLIED', label: 'Leads' },
  { event: 'LEAD_INVITED', label: 'Invitados' },
  { event: 'INVITE_CONSUMED', label: 'Activados' },
  { event: 'PLANT_CREATED', label: 'Plantas' },
  { event: 'READING_CREATED', label: 'Lecturas' },
]

const SEVERITY_WEIGHT: Record<Severity, number> = { low: 1, medium: 2, high: 3 }

const FRICTION_ACTION_MAP: Record<string, { area: string; action: string }> = {
  location_confusion: { area: 'Formulario de planta', action: 'Agregar mapa interactivo o autocompletado de ubicacion' },
  plant_setup_too_long: { area: 'Creacion de planta', action: 'Reducir campos requeridos o agregar wizard guiado' },
  reading_source_unknown: { area: 'Registro de lecturas', action: 'Agregar guia visual de donde encontrar datos del inversor' },
  cleaning_day_confusion: { area: 'Registro de lecturas', action: 'Mejorar UX del toggle de limpieza con tooltip explicativo' },
  trust_in_result_low: { area: 'Resultados de soiling', action: 'Mostrar metodologia de calculo y fuentes de datos' },
  invite_link_issue: { area: 'Flujo de invitacion', action: 'Mejorar email de invitacion y verificar links' },
  password_issue: { area: 'Registro de cuenta', action: 'Simplificar requisitos de contrasena o agregar OAuth' },
  abandoned_apply: { area: 'Formulario de aplicacion', action: 'Reducir campos o agregar guardado automatico' },
  unknown: { area: 'General', action: 'Investigar causa raiz del problema' },
}

export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const supabase = createServiceClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const from = weekAgo.toISOString()
  const to = now.toISOString()

  // 1. Funnel events (last 7 days)
  const funnelSteps: FunnelMetrics['steps'] = []
  for (const step of FUNNEL_ORDER) {
    const { count } = await supabase
      .from('funnel_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_name', step.event)
      .gte('created_at', from)

    funnelSteps.push({ event: step.event, label: step.label, count: count ?? 0 })
  }

  const conversionRates: FunnelMetrics['conversionRates'] = []
  for (let i = 1; i < funnelSteps.length; i++) {
    const prev = funnelSteps[i - 1]
    const curr = funnelSteps[i]
    conversionRates.push({
      from: prev.label,
      to: curr.label,
      rate: prev.count > 0 ? Math.round((curr.count / prev.count) * 100) : 0,
    })
  }

  // 2. Friction events (last 7 days)
  const { data: frictionRows } = await supabase
    .from('friction_events')
    .select('friction_tag, severity, step_key')
    .gte('created_at', from)

  const frictionMap = new Map<FrictionTag, { count: number; severitySum: number; steps: Set<string> }>()
  for (const row of (frictionRows ?? []) as Array<{ friction_tag: FrictionTag; severity: Severity; step_key: string }>) {
    const entry = frictionMap.get(row.friction_tag) ?? { count: 0, severitySum: 0, steps: new Set<string>() }
    entry.count++
    entry.severitySum += SEVERITY_WEIGHT[row.severity]
    entry.steps.add(row.step_key)
    frictionMap.set(row.friction_tag, entry)
  }

  const friction: FrictionSummary[] = Array.from(frictionMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      avgSeverity: data.count > 0 ? data.severitySum / data.count : 0,
      topSteps: Array.from(data.steps).slice(0, 3),
    }))
    .sort((a, b) => (b.count * b.avgSeverity) - (a.count * a.avgSeverity))

  // 3. Feedback (last 7 days)
  const { data: feedbackRows } = await supabase
    .from('feedback_responses')
    .select('context, response_value, response_text')
    .gte('created_at', from)

  const typedFeedback = (feedbackRows ?? []) as Array<{
    context: string
    response_value: number | null
    response_text: string | null
  }>

  const feedbackByContext = new Map<string, { count: number; ratingSum: number; ratingCount: number }>()
  const recentTexts: string[] = []

  for (const row of typedFeedback) {
    const entry = feedbackByContext.get(row.context) ?? { count: 0, ratingSum: 0, ratingCount: 0 }
    entry.count++
    if (row.response_value != null) {
      entry.ratingSum += row.response_value
      entry.ratingCount++
    }
    if (row.response_text) recentTexts.push(row.response_text)
    feedbackByContext.set(row.context, entry)
  }

  const allRatings = typedFeedback.filter((r) => r.response_value != null).map((r) => r.response_value!)
  const avgRating = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : null

  const feedback: FeedbackSummary = {
    totalResponses: typedFeedback.length,
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    byContext: Array.from(feedbackByContext.entries()).map(([context, data]) => ({
      context,
      count: data.count,
      avgRating: data.ratingCount > 0 ? Math.round((data.ratingSum / data.ratingCount) * 10) / 10 : null,
    })),
    recentTexts: recentTexts.slice(0, 5),
  }

  // 4. Onboarding summary
  const [{ count: startedCount }, { count: completedCount }] = await Promise.all([
    supabase.from('onboarding_answers').select('*', { count: 'exact', head: true }),
    supabase.from('onboarding_answers').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
  ])

  const { data: onboardingRows } = await supabase
    .from('onboarding_answers')
    .select('user_type, primary_goal')

  const typedOnboarding = (onboardingRows ?? []) as Array<{ user_type: string | null; primary_goal: string | null }>
  const userTypes = typedOnboarding.map((r) => r.user_type).filter(Boolean) as string[]
  const goals = typedOnboarding.map((r) => r.primary_goal).filter(Boolean) as string[]

  const onboarding: OnboardingSummary = {
    totalStarted: startedCount ?? 0,
    totalCompleted: completedCount ?? 0,
    completionRate: (startedCount ?? 0) > 0
      ? Math.round(((completedCount ?? 0) / (startedCount ?? 0)) * 100)
      : 0,
    topUserType: mode(userTypes),
    topGoal: mode(goals),
  }

  // 5. Prioritized improvements (from friction tags)
  const improvements: Improvement[] = friction
    .slice(0, 5)
    .map((f) => {
      const mapping = FRICTION_ACTION_MAP[f.tag] ?? FRICTION_ACTION_MAP.unknown
      const priority: Improvement['priority'] = f.avgSeverity >= 2.5 ? 'high' : f.avgSeverity >= 1.5 ? 'medium' : 'low'
      return {
        priority,
        area: mapping.area,
        action: mapping.action,
        evidence: `${f.count} eventos (severidad promedio: ${f.avgSeverity.toFixed(1)})`,
      }
    })

  // Add low-feedback improvement if applicable
  if (feedback.totalResponses === 0) {
    improvements.push({
      priority: 'medium',
      area: 'Feedback',
      action: 'No se recibio feedback esta semana — considerar mostrar widget en mas contextos',
      evidence: '0 respuestas',
    })
  }

  return {
    period: { from, to },
    funnel: { steps: funnelSteps, conversionRates },
    friction,
    feedback,
    onboarding,
    improvements,
    generatedAt: now.toISOString(),
  }
}

/** Returns the most frequent value, or null if empty */
function mode(arr: string[]): string | null {
  if (arr.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1)
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
}
