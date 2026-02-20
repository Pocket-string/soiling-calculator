'use client'

import { useState, useTransition } from 'react'
import { deletePlant } from '@/actions/plants'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Props {
  plantId: string
  plantName: string
}

export function DeletePlantButton({ plantId, plantName }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending] = useTransition()

  async function handleConfirm() {
    await deletePlant(plantId)
    // deletePlant calls redirect('/plants') on success — this line won't execute
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="px-4 py-2 text-sm font-medium text-error-600 border border-error-500 rounded-lg hover:bg-error-50 transition-colors disabled:opacity-50"
      >
        Eliminar planta
      </button>
      <ConfirmDialog
        open={showConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        title="Eliminar planta"
        description={`Se eliminara permanentemente "${plantName}" y todas sus lecturas. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </>
  )
}
