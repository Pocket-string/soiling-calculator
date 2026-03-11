'use client'

import { useState } from 'react'
import { triageAllLeadsAction } from '@/actions/intelligence'

export function TriageAllButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ processed: number; errors: string[] } | null>(null)

  async function handleClick() {
    if (!window.confirm('Ejecutar triage para todos los leads? Esto recalcula prioridades.')) return

    setLoading(true)
    setResult(null)

    try {
      const res = await triageAllLeadsAction()
      setResult(res)
    } catch {
      setResult({ processed: 0, errors: ['Error inesperado'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Triaging...' : 'Re-triage todos'}
      </button>
      {result && (
        <span className="text-sm text-foreground-secondary">
          {result.processed} procesados
          {result.errors.length > 0 && `, ${result.errors.length} errores`}
        </span>
      )}
    </div>
  )
}
