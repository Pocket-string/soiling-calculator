'use client'

import { useState, useTransition } from 'react'
import { saveOnboardingAnswer, dismissOnboarding } from '@/actions/onboarding'
import type { OnboardingQuestion } from '../services/activationConcierge'

interface Props {
  questions: OnboardingQuestion[]
  initialStep?: number
}

export function OnboardingBanner({ questions, initialStep = 0 }: Props) {
  const [step, setStep] = useState(initialStep)
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed || step >= questions.length) return null

  const current = questions[step]
  const total = questions.length

  function handleAnswer(value: string) {
    startTransition(async () => {
      const result = await saveOnboardingAnswer(current.key, value)
      if (!result.error) {
        if (step + 1 >= total) {
          setDismissed(true)
        } else {
          setStep(step + 1)
        }
      }
    })
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissOnboarding()
      setDismissed(true)
    })
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-surface p-5 shadow-card animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? 'w-6 bg-primary-500' : 'w-3 bg-border'
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-foreground-muted">
              {step + 1} / {total}
            </span>
          </div>

          {/* Headline */}
          {step === 0 && (
            <p className="text-xs text-primary-600 font-semibold mb-1">
              Personaliza tu experiencia (30 seg)
            </p>
          )}

          {/* Question */}
          <p className="text-sm font-medium text-foreground mb-3">
            {current.question}
          </p>

          {/* Options as pill buttons */}
          <div className="flex flex-wrap gap-2">
            {current.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                disabled={isPending}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-foreground-secondary hover:bg-surface-alt hover:border-primary-500 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="text-xs text-foreground-muted hover:text-foreground-secondary transition-colors flex-shrink-0"
          title="Omitir"
        >
          Mas tarde
        </button>
      </div>
    </div>
  )
}
