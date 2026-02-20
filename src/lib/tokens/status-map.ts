import type { CleaningLevel } from '@/features/plants/types'

interface StatusConfig {
  /** Human-readable label (Spanish) */
  label: string
  /** Descriptive message for recommendation cards */
  message: string
  /** Tailwind classes for badge: bg + text + border */
  badge: string
  /** Tailwind class for status dot */
  dot: string
  /** Tailwind classes for compact pill (no border) */
  pill: string
}

/**
 * Status → Tailwind class map for cleaning recommendation levels.
 * SINGLE SOURCE OF TRUTH — every component must import from here.
 *
 * Palette:
 *   OK          → success tokens (green)
 *   WATCH       → warning tokens (amber)
 *   RECOMMENDED → orange (distinct from WATCH)
 *   URGENT      → error tokens (red)
 */
export const STATUS_MAP: Record<CleaningLevel, StatusConfig> = {
  OK: {
    label: 'Soiling bajo',
    message: 'Los paneles están funcionando cerca del óptimo. No es necesario limpiar.',
    badge: 'bg-success-50 text-success-700 border-success-100',
    dot: 'bg-success-500',
    pill: 'bg-success-50 text-success-700',
  },
  WATCH: {
    label: 'Vigilar',
    message: 'Hay suciedad incipiente. Monitoriza de cerca en los próximos días.',
    badge: 'bg-warning-50 text-warning-700 border-warning-100',
    dot: 'bg-warning-500',
    pill: 'bg-warning-50 text-warning-700',
  },
  RECOMMENDED: {
    label: 'Limpiar pronto',
    message: 'Las pérdidas justifican una limpieza pronto. Programa una visita.',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    pill: 'bg-orange-50 text-orange-700',
  },
  URGENT: {
    label: 'URGENTE',
    message: 'Las pérdidas son significativas. Limpia lo antes posible para maximizar ROI.',
    badge: 'bg-error-50 text-error-700 border-error-100',
    dot: 'bg-error-500',
    pill: 'bg-error-50 text-error-700',
  },
} as const

/** Fallback config when no cleaning level is available */
export const STATUS_UNKNOWN: StatusConfig = {
  label: 'Sin datos',
  message: '',
  badge: 'bg-surface-alt text-foreground-muted border-border',
  dot: 'bg-foreground-muted',
  pill: 'bg-surface-alt text-foreground-muted',
}

export type { StatusConfig }
