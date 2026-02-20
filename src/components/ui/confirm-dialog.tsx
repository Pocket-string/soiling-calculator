'use client'

import { useEffect, useTransition, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      // Focus trap: Tab cycles between cancel and confirm buttons
      if (e.key === 'Tab') {
        const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[]
        if (focusable.length === 0) return
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey) {
          e.preventDefault()
          const prev = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
          focusable[prev].focus()
        } else {
          e.preventDefault()
          const next = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1
          focusable[next].focus()
        }
      }
    },
    [onCancel],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    // Auto-focus cancel button on open
    cancelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const confirmColors =
    variant === 'danger'
      ? 'bg-error-600 hover:bg-error-700 focus:ring-error-500'
      : 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onCancel} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative bg-surface rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-fade-in"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p id="confirm-dialog-desc" className="text-sm text-foreground-secondary mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-alt transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await onConfirm()
              })
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmColors}`}
          >
            {isPending ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
