'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface NotificationPreferences {
  email_alerts_enabled: boolean
  soiling_threshold_warning: number
  soiling_threshold_urgent: number
}

const DEFAULTS: NotificationPreferences = {
  email_alerts_enabled: true,
  soiling_threshold_warning: 5.0,
  soiling_threshold_urgent: 10.0,
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data } = await supabase
    .from('notification_preferences')
    .select('email_alerts_enabled, soiling_threshold_warning, soiling_threshold_urgent')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return DEFAULTS

  return {
    email_alerts_enabled: data.email_alerts_enabled,
    soiling_threshold_warning: data.soiling_threshold_warning,
    soiling_threshold_urgent: data.soiling_threshold_urgent,
  }
}

export async function updateNotificationPreferences(
  formData: FormData,
): Promise<{ error: string | null }> {
  const user = await requireAuth()
  const supabase = await createClient()

  const email_alerts_enabled = formData.get('email_alerts_enabled') === 'true'
  const soiling_threshold_warning = parseFloat(formData.get('soiling_threshold_warning') as string) || 5.0
  const soiling_threshold_urgent = parseFloat(formData.get('soiling_threshold_urgent') as string) || 10.0

  // Validate: warning < urgent
  if (soiling_threshold_warning >= soiling_threshold_urgent) {
    return { error: 'El umbral de advertencia debe ser menor que el umbral urgente' }
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      email_alerts_enabled,
      soiling_threshold_warning,
      soiling_threshold_urgent,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('[updateNotificationPreferences]', error)
    return { error: 'Error al guardar preferencias' }
  }

  revalidatePath('/settings')
  return { error: null }
}
