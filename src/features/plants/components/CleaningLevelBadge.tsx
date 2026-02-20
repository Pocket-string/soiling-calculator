'use client'

import type { CleaningLevel } from '@/features/plants/types'
import { STATUS_MAP, STATUS_UNKNOWN } from '@/lib/tokens/status-map'

interface Props {
  level: CleaningLevel | null | undefined
  soilingPercent?: number | null
  size?: 'sm' | 'md'
}

export function CleaningLevelBadge({ level, soilingPercent, size = 'md' }: Props) {
  const config = level ? STATUS_MAP[level] : STATUS_UNKNOWN
  const label = level === 'OK' && soilingPercent === 0 ? 'Sin soiling' : config.label

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium ${config.badge} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  )
}
