import { PRIORITY_LABELS, type PriorityLabel } from '../types'

interface Props {
  priority: PriorityLabel
  className?: string
}

export function PriorityBadge({ priority, className = '' }: Props) {
  const config = PRIORITY_LABELS.find((p) => p.value === priority)
  if (!config) return null

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${config.color} ${className}`}
    >
      {config.label}
    </span>
  )
}
