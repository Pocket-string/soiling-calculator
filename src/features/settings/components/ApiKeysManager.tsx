'use client'

import { useState } from 'react'
import { createApiKey, revokeApiKey } from '@/actions/api-keys'
import type { ApiKeyInfo } from '@/actions/api-keys'

interface Props {
  initialKeys: ApiKeyInfo[]
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 30) return `Hace ${diffDays} días`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return 'Hace 1 mes'
  if (diffMonths < 12) return `Hace ${diffMonths} meses`
  return `Hace ${Math.floor(diffMonths / 12)} años`
}

interface NewKeyBannerProps {
  rawKey: string
  onClose: () => void
}

function NewKeyBanner({ rawKey, onClose }: NewKeyBannerProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-warning-300 bg-warning-50 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-warning-800">
            Copia tu API key ahora. No podras verla de nuevo.
          </p>
          <p className="text-xs text-warning-700 mt-0.5">
            Guarda este valor en un lugar seguro antes de cerrar.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar banner"
          className="text-warning-600 hover:text-warning-800 transition-colors flex-shrink-0 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-warning-100 border border-warning-200 px-3 py-2">
        <code className="font-mono text-xs text-warning-900 break-all flex-1 select-all">
          {rawKey}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-warning-600 text-white text-xs font-semibold hover:bg-warning-700 transition-colors"
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

export function ApiKeysManager({ initialKeys }: Props) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>(initialKeys)
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)

  async function handleCreate() {
    if (!newKeyName.trim()) return
    setIsCreating(true)
    setCreateError(null)
    setNewlyCreatedKey(null)

    const result = await createApiKey(newKeyName.trim())

    if ('error' in result) {
      setCreateError(result.error)
    } else {
      setKeys((prev) => [result.info, ...prev])
      setNewlyCreatedKey(result.key)
      setNewKeyName('')
    }

    setIsCreating(false)
  }

  async function handleRevoke(keyId: string, keyName: string) {
    const confirmed = window.confirm(
      `¿Seguro que quieres revocar la API key "${keyName}"? Esta accion no se puede deshacer.`,
    )
    if (!confirmed) return

    setRevokingId(keyId)
    setRevokeError(null)

    const result = await revokeApiKey(keyId)

    if (result.error) {
      setRevokeError(result.error)
    } else {
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, is_active: false } : k)),
      )
      if (newlyCreatedKey !== null) {
        const revokedInfo = keys.find((k) => k.id === keyId)
        if (revokedInfo) setNewlyCreatedKey(null)
      }
    }

    setRevokingId(null)
  }

  return (
    <div className="space-y-5">
      {/* Banner key recien creada */}
      {newlyCreatedKey && (
        <NewKeyBanner
          rawKey={newlyCreatedKey}
          onClose={() => setNewlyCreatedKey(null)}
        />
      )}

      {/* Formulario crear nueva key */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Nueva API key</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            placeholder="Nombre de la key (ej: Produccion, CI/CD)"
            maxLength={64}
            aria-label="Nombre de la nueva API key"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || newKeyName.trim().length < 2}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Creando...' : 'Crear API Key'}
          </button>
        </div>
        {createError && (
          <p className="text-xs text-error-600">{createError}</p>
        )}
      </div>

      {/* Lista de keys */}
      {keys.length === 0 ? (
        <p className="text-sm text-foreground-secondary py-4 text-center">
          No tienes API keys activas. Crea una para empezar.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-foreground-secondary font-medium uppercase tracking-wide">
            Keys existentes ({keys.length})
          </p>
          <ul className="divide-y divide-border-light rounded-lg border border-border overflow-hidden" role="list">
            {keys.map((apiKey) => (
              <li
                key={apiKey.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-surface hover:bg-surface-alt transition-colors"
              >
                {/* Info key */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {apiKey.name}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                        apiKey.is_active
                          ? 'bg-success-100 text-success-700'
                          : 'bg-surface-alt text-foreground-secondary'
                      }`}
                      aria-label={apiKey.is_active ? 'Activa' : 'Revocada'}
                    >
                      {apiKey.is_active ? 'Activa' : 'Revocada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="font-mono text-xs text-foreground-secondary">
                      {apiKey.key_prefix}
                    </code>
                    <span className="text-xs text-foreground-secondary">
                      Ultimo uso: {formatRelativeDate(apiKey.last_used_at)}
                    </span>
                  </div>
                </div>

                {/* Accion revocar */}
                {apiKey.is_active && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(apiKey.id, apiKey.name)}
                    disabled={revokingId === apiKey.id}
                    aria-label={`Revocar API key ${apiKey.name}`}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {revokingId === apiKey.id ? 'Revocando...' : 'Revocar'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {revokeError && (
            <p className="text-xs text-error-600">{revokeError}</p>
          )}
        </div>
      )}
    </div>
  )
}
