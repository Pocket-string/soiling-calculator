'use client'

import { useState } from 'react'
import type { ScoreBreakdown } from '../services/leadScorer'

interface Props {
  breakdown: ScoreBreakdown
  children: React.ReactNode
}

const ITEMS = [
  { key: 'commitment' as const, label: 'Compromiso semanal', max: 30 },
  { key: 'inverter' as const, label: 'Marca inversor', max: 25 },
  { key: 'frequency' as const, label: 'Frecuencia reporte', max: 20 },
  { key: 'systemSize' as const, label: 'Tamaño sistema', max: 15 },
  { key: 'location' as const, label: 'Ubicación completa', max: 10 },
]

export function ScoreTooltip({ breakdown, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-surface border border-border rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold text-foreground mb-2">Desglose de puntaje</p>
          {ITEMS.map(({ key, label, max }) => (
            <div key={key} className="flex justify-between py-0.5">
              <span className="text-foreground-secondary">{label}</span>
              <span
                className={
                  breakdown[key] > 0
                    ? 'text-foreground font-medium'
                    : 'text-foreground-muted'
                }
              >
                {breakdown[key]}/{max}
              </span>
            </div>
          ))}
          <div className="border-t border-border-light mt-1.5 pt-1.5 flex justify-between font-semibold text-foreground">
            <span>Total</span>
            <span>{breakdown.total}/100</span>
          </div>
        </div>
      )}
    </div>
  )
}
