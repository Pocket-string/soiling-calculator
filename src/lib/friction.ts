import { createServiceClient } from '@/lib/supabase/server'
import type { FrictionTag, Severity } from '@/features/intelligence/types'

interface TrackFrictionParams {
  userId?: string
  leadId?: string
  stage: string
  stepKey: string
  frictionTag: FrictionTag
  severity?: Severity
  details?: Record<string, unknown>
}

/** Fire-and-forget friction tracking. Never throws — silently logs errors. */
export async function trackFriction({
  userId,
  leadId,
  stage,
  stepKey,
  frictionTag,
  severity = 'medium',
  details = {},
}: TrackFrictionParams): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('friction_events').insert({
      user_id: userId ?? null,
      lead_id: leadId ?? null,
      stage,
      step_key: stepKey,
      friction_tag: frictionTag,
      severity,
      details,
    })
  } catch (e) {
    console.warn('[trackFriction] Failed:', frictionTag, e)
  }
}
