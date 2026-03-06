import { z } from 'zod'

// ============================================================
// ZOD SCHEMAS — Validacion de inputs de usuario
// ============================================================

export const onboardingAnswerSchema = z.object({
  key: z.enum(['user_type', 'primary_goal', 'pain_point', 'data_entry_preference']),
  value: z.string().min(1).max(100),
})

export const feedbackResponseSchema = z.object({
  context: z.string().min(1).max(100),
  question_key: z.string().min(1).max(100),
  response_value: z.coerce.number().int().min(1).max(5).nullable().optional(),
  response_text: z.string().max(500).nullable().optional(),
  page_path: z.string().max(255).nullable().optional(),
})

export const frictionEventSchema = z.object({
  stage: z.string().min(1).max(50),
  step_key: z.string().min(1).max(100),
  friction_tag: z.enum([
    'location_confusion',
    'plant_setup_too_long',
    'reading_source_unknown',
    'cleaning_day_confusion',
    'trust_in_result_low',
    'invite_link_issue',
    'password_issue',
    'abandoned_apply',
    'unknown',
  ]),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  details: z.record(z.string(), z.unknown()).default({}),
})

export type OnboardingAnswerInput = z.infer<typeof onboardingAnswerSchema>
export type FeedbackResponseInput = z.infer<typeof feedbackResponseSchema>
export type FrictionEventInput = z.infer<typeof frictionEventSchema>
