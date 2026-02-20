'use client'

import { useState } from 'react'
import { deleteReading } from '@/actions/readings'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Props {
  readingId: string
  plantId: string
  readingDate: string
}

export function DeleteReadingButton({ readingId, plantId, readingDate }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleConfirm() {
    await deleteReading(readingId, plantId)
    setShowConfirm(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="p-1 text-foreground-muted hover:text-error-500 transition-colors"
        title="Eliminar lectura"
        aria-label="Eliminar lectura"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <ConfirmDialog
        open={showConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        title="Eliminar lectura"
        description={`Se eliminara la lectura del ${readingDate}. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </>
  )
}
