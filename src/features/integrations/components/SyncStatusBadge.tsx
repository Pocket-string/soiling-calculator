import { Badge } from '@/components/ui/badge'
import type { SyncStatus } from '../types'

interface Props {
  status: SyncStatus | null
  lastSyncAt?: string | null
}

const statusConfig: Record<SyncStatus, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  success: { label: 'Sincronizado', variant: 'success' },
  partial: { label: 'Parcial', variant: 'warning' },
  error: { label: 'Error', variant: 'error' },
}

export function SyncStatusBadge({ status, lastSyncAt }: Props) {
  if (!status) {
    return <Badge variant="default">Sin sincronizar</Badge>
  }

  const config = statusConfig[status]
  const timeAgo = lastSyncAt ? formatTimeAgo(lastSyncAt) : null

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={config.variant}>{config.label}</Badge>
      {timeAgo && (
        <span className="text-xs text-foreground-muted">{timeAgo}</span>
      )}
    </span>
  )
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}
