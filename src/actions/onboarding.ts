'use server'

import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { track, EVENTS } from '@/lib/tracking'
import { onboardingAnswerSchema } from '@/features/intelligence/types/schemas'
import type { OnboardingAnswers } from '@/features/intelligence/types'

/** Get onboarding status for current user. Returns null if no row exists. */
export async function getOnboardingStatus(userId: string): Promise<OnboardingAnswers | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('onboarding_answers')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data as OnboardingAnswers | null
}

/** Save a single onboarding answer (upsert). */
export async function saveOnboardingAnswer(
  rawKey: string,
  rawValue: string
): Promise<{ error?: string }> {
  const user = await requireAuth()

  const parsed = onboardingAnswerSchema.safeParse({ key: rawKey, value: rawValue })
  if (!parsed.success) return { error: 'Respuesta inválida' }

  const { key, value } = parsed.data
  const supabase = await createClient()

  // Check if row exists
  const { data: existing } = await supabase
    .from('onboarding_answers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Update existing row
    const { error } = await supabase
      .from('onboarding_answers')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) return { error: error.message }
  } else {
    // Insert new row
    const { error } = await supabase
      .from('onboarding_answers')
      .insert({ user_id: user.id, [key]: value })

    if (error) return { error: error.message }

    // Track onboarding started
    track({ event: EVENTS.ONBOARDING_STARTED, userId: user.id })
  }

  // Track step completed
  track({
    event: EVENTS.ONBOARDING_STEP_COMPLETED,
    userId: user.id,
    metadata: { key, value },
  })

  return {}
}

/** Mark onboarding as dismissed/completed. */
export async function dismissOnboarding(): Promise<{ error?: string }> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Upsert with completed_at
  const { error } = await supabase
    .from('onboarding_answers')
    .upsert(
      {
        user_id: user.id,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }
  return {}
}
