import {
  USER_TYPES,
  PRIMARY_GOALS,
  PAIN_POINTS,
  DATA_ENTRY_PREFERENCES,
} from '../types/taxonomies'
import type { OnboardingAnswers } from '../types'

// ============================================================
// ACTIVATION CONCIERGE — Onboarding micro-questions
// ============================================================

export interface OnboardingQuestion {
  key: keyof Pick<OnboardingAnswers, 'user_type' | 'primary_goal' | 'pain_point' | 'data_entry_preference'>
  question: string
  options: Array<{ value: string; label: string }>
}

const QUESTIONS: OnboardingQuestion[] = [
  {
    key: 'user_type',
    question: '¿Cuál es tu rol?',
    options: USER_TYPES.map((t) => ({ value: t.value, label: t.label })),
  },
  {
    key: 'primary_goal',
    question: '¿Cuál es tu objetivo principal?',
    options: PRIMARY_GOALS.map((g) => ({ value: g.value, label: g.label })),
  },
  {
    key: 'pain_point',
    question: '¿Cuál es tu mayor desafío hoy?',
    options: PAIN_POINTS.map((p) => ({ value: p.value, label: p.label })),
  },
  {
    key: 'data_entry_preference',
    question: '¿Cómo prefieres cargar datos?',
    options: DATA_ENTRY_PREFERENCES.map((d) => ({ value: d.value, label: d.label })),
  },
]

/** Returns the ordered list of all onboarding questions. */
export function getOnboardingQuestions(): OnboardingQuestion[] {
  return QUESTIONS
}

/** Returns the next unanswered question, or null if all answered. */
export function getNextQuestion(
  currentAnswers: Partial<OnboardingAnswers>
): OnboardingQuestion | null {
  for (const q of QUESTIONS) {
    if (!currentAnswers[q.key]) return q
  }
  return null
}
