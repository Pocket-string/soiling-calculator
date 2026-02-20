import { createServiceClient } from '@/lib/supabase/server'

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
