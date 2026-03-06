'use server'

import { requireAuth } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { track, EVENTS } from '@/lib/tracking'
import { feedbackResponseSchema } from '@/features/intelligence/types/schemas'

/** Submit contextual feedback (1-5 stars + optional text). */
export async function submitFeedback(
  rawContext: string,
  rawQuestionKey: string,
  rawResponseValue: number | null,
  rawResponseText: string | null,
  rawPagePath: string | null,
): Promise<{ error?: string }> {
  const user = await requireAuth()

  const parsed = feedbackResponseSchema.safeParse({
    context: rawContext,
    question_key: rawQuestionKey,
    response_value: rawResponseValue,
    response_text: rawResponseText,
    page_path: rawPagePath,
  })
  if (!parsed.success) return { error: 'Datos de feedback invalidos' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('feedback_responses')
    .insert({
      user_id: user.id,
      context: parsed.data.context,
      question_key: parsed.data.question_key,
      response_value: parsed.data.response_value ?? null,
      response_text: parsed.data.response_text ?? null,
      page_path: parsed.data.page_path ?? null,
    })

  if (error) return { error: error.message }

  track({
    event: EVENTS.FEEDBACK_SUBMITTED,
    userId: user.id,
    metadata: { context: parsed.data.context, rating: parsed.data.response_value },
  })

  return {}
}

/** Check if user already submitted feedback for a given context. */
export async function hasFeedbackForContext(
  userId: string,
  context: string,
): Promise<boolean> {
  const supabase = createServiceClient()

  const { count } = await supabase
    .from('feedback_responses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('context', context)

  return (count ?? 0) > 0
}
