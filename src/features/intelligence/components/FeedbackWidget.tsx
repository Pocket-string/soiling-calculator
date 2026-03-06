'use client'

import { useState, useTransition } from 'react'
import { submitFeedback } from '@/actions/feedback'

interface Props {
  context: string
  questionKey?: string
  question?: string
  pagePath?: string
}

export function FeedbackWidget({
  context,
  questionKey = 'satisfaction',
  question = 'Como fue tu experiencia?',
  pagePath,
}: Props) {
  const [rating, setRating] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed || submitted) return null

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitFeedback(
        context,
        questionKey,
        rating,
        text.trim() || null,
        pagePath ?? null,
      )
      if (!result.error) {
        setSubmitted(true)
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-foreground">{question}</p>

          {/* Star rating */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                disabled={isPending}
                className={`w-8 h-8 rounded-full text-lg transition-colors ${
                  rating && star <= rating
                    ? 'bg-warning-100 text-warning-600'
                    : 'bg-surface-alt text-foreground-muted hover:bg-surface-alt hover:text-foreground-secondary'
                } disabled:opacity-50`}
                title={`${star} estrella${star > 1 ? 's' : ''}`}
              >
                {rating && star <= rating ? '\u2605' : '\u2606'}
              </button>
            ))}
          </div>

          {/* Optional text (show after rating) */}
          {rating && (
            <div className="space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Comentario opcional..."
                maxLength={500}
                rows={2}
                disabled={isPending}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Enviando...' : 'Enviar feedback'}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-foreground-muted hover:text-foreground-secondary transition-colors flex-shrink-0"
          title="Cerrar"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
