'use server'

import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateLeadScore } from '@/features/leads/services/leadScorer'
import { triageLead } from '@/features/intelligence/services/leadTriageAgent'
import { generateWeeklyReport, type WeeklyReport } from '@/features/intelligence/services/weeklyAnalyst'
import { track, EVENTS } from '@/lib/tracking'
import type { LeadEnrichment } from '@/features/intelligence/types'
import type { Lead } from '@/features/leads/types'

// ============================================================
// LEAD TRIAGE
// ============================================================

/** Triage a single lead and upsert enrichment. Uses service client (no auth needed). */
export async function triageLeadAction(leadId: string): Promise<{ error?: string }> {
  const startMs = Date.now()
  const supabase = createServiceClient()

  try {
    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) return { error: 'Lead no encontrado' }

    // Compute triage
    const scoreBreakdown = calculateLeadScore(lead as Lead)
    const triage = triageLead(lead as Lead, scoreBreakdown)

    // Upsert enrichment
    const { error: upsertError } = await supabase
      .from('lead_enrichment')
      .upsert(
        {
          lead_id: leadId,
          fit_score: triage.fitScore,
          activation_likelihood: triage.activationLikelihood,
          integration_potential: triage.integrationPotential,
          urgency: triage.urgency,
          priority_label: triage.priorityLabel,
          recommended_action: triage.recommendedAction,
          fit_reason: triage.fitReason,
          agent_version: 'v1',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lead_id' }
      )

    if (upsertError) return { error: upsertError.message }

    // Log agent run
    await supabase.from('agent_runs').insert({
      agent_name: 'lead_triage',
      entity_type: 'lead',
      entity_id: leadId,
      status: 'completed',
      input_snapshot: { lead_id: leadId, score: scoreBreakdown.total },
      output_snapshot: triage,
      agent_version: 'v1',
      duration_ms: Date.now() - startMs,
    })

    return {}
  } catch (e) {
    // Log failed run
    await supabase.from('agent_runs').insert({
      agent_name: 'lead_triage',
      entity_type: 'lead',
      entity_id: leadId,
      status: 'failed',
      error_message: e instanceof Error ? e.message : 'Unknown error',
      agent_version: 'v1',
      duration_ms: Date.now() - startMs,
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void 0 // fire-and-forget, errors already caught above

    return { error: 'Error en triage' }
  }
}

/** Get all lead enrichments (admin only, for leads table). */
export async function getLeadEnrichments(): Promise<LeadEnrichment[]> {
  await requireAdmin()
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('lead_enrichment')
    .select('*')
    .order('updated_at', { ascending: false })

  return (data ?? []) as LeadEnrichment[]
}

// ============================================================
// WEEKLY PRODUCT ANALYST
// ============================================================

/** Generate a weekly product report (admin only). */
export async function generateWeeklyReportAction(): Promise<{ data?: WeeklyReport; error?: string }> {
  const startMs = Date.now()
  await requireAdmin()
  const supabase = createServiceClient()

  try {
    const report = await generateWeeklyReport()

    // Log agent run
    await supabase.from('agent_runs').insert({
      agent_name: 'weekly_analyst',
      entity_type: 'report',
      entity_id: null,
      status: 'completed',
      input_snapshot: { period: report.period },
      output_snapshot: report as unknown as Record<string, unknown>,
      agent_version: 'v1',
      duration_ms: Date.now() - startMs,
    })

    track({ event: EVENTS.WEEKLY_REPORT_GENERATED })

    return { data: report }
  } catch (e) {
    await supabase.from('agent_runs').insert({
      agent_name: 'weekly_analyst',
      entity_type: 'report',
      entity_id: null,
      status: 'failed',
      error_message: e instanceof Error ? e.message : 'Unknown error',
      agent_version: 'v1',
      duration_ms: Date.now() - startMs,
    })

    return { error: 'Error generando reporte semanal' }
  }
}

/** Get the latest weekly report from agent_runs. */
export async function getLatestWeeklyReport(): Promise<WeeklyReport | null> {
  await requireAdmin()
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('agent_runs')
    .select('output_snapshot')
    .eq('agent_name', 'weekly_analyst')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null
  return data.output_snapshot as unknown as WeeklyReport
}
