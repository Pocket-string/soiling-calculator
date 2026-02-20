'use client'

import { useState, useRef, useTransition } from 'react'
import { updateLeadNotes } from '@/actions/leads'

interface Props {
  leadId: string
  initialNotes: string | null
  onSaved?: (notes: string | null) => void
}

export function InlineNotesEditor({ leadId, initialNotes, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSave() {
    startTransition(async () => {
      const result = await updateLeadNotes(leadId, value)
      if (!result.error) {
        setEditing(false)
        onSaved?.(value.trim() || null)
      }
    })
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true)
          setTimeout(() => textareaRef.current?.focus(), 0)
        }}
        className="text-xs text-foreground-muted hover:text-foreground-secondary cursor-pointer text-left max-w-[200px] truncate"
        title={initialNotes || 'Click para agregar nota'}
      >
        {initialNotes || '+ nota'}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        maxLength={500}
        className="text-xs border border-border rounded-lg px-2 py-1.5 w-48 resize-none focus:outline-none focus:ring-1 focus:ring-accent-500"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setEditing(false)
            setValue(initialNotes ?? '')
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
        }}
      />
      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs px-2 py-0.5 bg-success-600 text-white rounded hover:bg-success-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'Guardar'}
        </button>
        <button
          onClick={() => {
            setEditing(false)
            setValue(initialNotes ?? '')
          }}
          className="text-xs px-2 py-0.5 text-foreground-secondary hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
