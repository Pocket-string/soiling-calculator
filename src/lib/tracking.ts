import { createServiceClient } from '@/lib/supabase/server'

/** All tracked funnel events — single source of truth */
export const EVENTS = {
  // Existing (Fase 7)
  LEAD_APPLIED: 'LEAD_APPLIED',
  LEAD_INVITED: 'LEAD_INVITED',
  INVITE_CONSUMED: 'INVITE_CONSUMED',
  PLANT_CREATED: 'PLANT_CREATED',
  READING_CREATED: 'READING_CREATED',
  // New (PRP-003)
  INVITE_OPENED: 'INVITE_OPENED',
  ONBOARDING_STARTED: 'ONBOARDING_STARTED',
  ONBOARDING_STEP_COMPLETED: 'ONBOARDING_STEP_COMPLETED',
  PLANT_CREATION_STARTED: 'PLANT_CREATION_STARTED',
  FIRST_READING_STARTED: 'FIRST_READING_STARTED',
  FIRST_READING_COMPLETED: 'FIRST_READING_COMPLETED',
  FEEDBACK_SUBMITTED: 'FEEDBACK_SUBMITTED',
  FRICTION_DETECTED: 'FRICTION_DETECTED',
  WEEKLY_REPORT_GENERATED: 'WEEKLY_REPORT_GENERATED',
  // Engagement (Activation Plan)
  REENGAGEMENT_SENT: 'REENGAGEMENT_SENT',
  USER_LOGIN: 'USER_LOGIN',
} as const

interface TrackEvent {
  event: string
  userId?: string
  leadId?: string
  metadata?: Record<string, unknown>
  ip?: string
}

/** Fire-and-forget event tracking. Never throws — silently logs errors. */
export async function track({ event, userId, leadId, metadata, ip }: TrackEvent): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('funnel_events').insert({
      event_name: event,
      user_id: userId ?? null,
      lead_id: leadId ?? null,
      metadata: metadata ?? {},
      ip_address: ip ?? null,
    })
  } catch (e) {
    console.warn('[track] Failed to log event:', event, e)
  }
}
