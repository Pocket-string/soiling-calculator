'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SyncStatusBadge } from './SyncStatusBadge'
import {
  saveIntegration,
  testIntegration,
  removeIntegration,
  toggleSync,
  manualSync,
} from '@/actions/integrations'
import type { InverterIntegration, InverterProvider } from '../types'

interface Props {
  plantId: string
  integration: InverterIntegration | null
}

const PROVIDER_OPTIONS = [
  { value: '', label: 'Seleccionar inversor...' },
  { value: 'solaredge', label: 'SolarEdge' },
  { value: 'huawei', label: 'Huawei FusionSolar' },
]

const REGION_OPTIONS = [
  { value: 'eu5', label: 'Europa (eu5)' },
  { value: 'intl', label: 'Internacional (intl)' },
  { value: 'la5', label: 'Latinoamerica (la5)' },
]

export function IntegrationSetup({ plantId, integration }: Props) {
  if (integration) {
    return <ConnectedView plantId={plantId} integration={integration} />
  }
  return <SetupForm plantId={plantId} />
}

// ── Connected View ──────────────────────────────────────────────────────────

function ConnectedView({
  plantId,
  integration,
}: {
  plantId: string
  integration: InverterIntegration
}) {
  const [isPending, startTransition] = useTransition()
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleToggleSync() {
    startTransition(async () => {
      setError(null)
      const result = await toggleSync(plantId, !integration.sync_enabled)
      if ('error' in result && result.error) setError(result.error)
    })
  }

  function handleManualSync() {
    startTransition(async () => {
      setError(null)
      setSyncResult(null)
      const result = await manualSync(plantId)
      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('data' in result && result.data) {
        const d = result.data
        setSyncResult(`${d.synced} sincronizadas, ${d.skipped} omitidas, ${d.errors} errores`)
      }
    })
  }

  function handleDisconnect() {
    if (!confirm('Desconectar el inversor eliminara la integracion. Continuar?')) return
    startTransition(async () => {
      setError(null)
      const result = await removeIntegration(plantId)
      if ('error' in result && result.error) setError(result.error)
    })
  }

  const providerLabel = integration.provider === 'solaredge' ? 'SolarEdge' : 'Huawei FusionSolar'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="info">{providerLabel}</Badge>
          <SyncStatusBadge
            status={integration.last_sync_status}
            lastSyncAt={integration.last_sync_at}
          />
        </div>
        {integration.external_site_id && (
          <span className="text-xs text-foreground-muted">
            ID: {integration.external_site_id}
          </span>
        )}
      </div>

      {integration.last_sync_error && (
        <p className="text-sm text-error-600 bg-error-50 rounded p-2">
          {integration.last_sync_error}
        </p>
      )}

      {integration.last_sync_readings_count > 0 && (
        <p className="text-sm text-foreground-muted">
          Ultima sync: {integration.last_sync_readings_count} lecturas
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleToggleSync}
          variant={integration.sync_enabled ? 'secondary' : 'primary'}
          disabled={isPending}
        >
          {integration.sync_enabled ? 'Desactivar auto-sync' : 'Activar auto-sync'}
        </Button>

        <Button
          onClick={handleManualSync}
          variant="secondary"
          disabled={isPending}
        >
          {isPending ? 'Sincronizando...' : 'Sync ahora (7 dias)'}
        </Button>

        <Button
          onClick={handleDisconnect}
          variant="secondary"
          disabled={isPending}
          className="text-error-600 hover:bg-error-50"
        >
          Desconectar
        </Button>
      </div>

      {syncResult && (
        <p className="text-sm text-success-700 bg-success-50 rounded p-2">
          {syncResult}
        </p>
      )}

      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
    </div>
  )
}

// ── Setup Form ──────────────────────────────────────────────────────────────

function SetupForm({ plantId }: { plantId: string }) {
  const [provider, setProvider] = useState<InverterProvider | ''>('')
  const [isPending, startTransition] = useTransition()
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleTest(formData: FormData) {
    startTransition(async () => {
      setError(null)
      setTestResult(null)
      const result = await testIntegration(formData)
      if ('error' in result && result.error) {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : JSON.stringify(result.error)
        setTestResult({ success: false, message: errorMsg })
      } else {
        setTestResult({ success: true, message: 'Conexion exitosa' })
      }
    })
  }

  function handleSave(formData: FormData) {
    startTransition(async () => {
      setError(null)
      const result = await saveIntegration(formData)
      if ('error' in result && result.error) {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : JSON.stringify(result.error)
        setError(errorMsg)
      }
      // On success, the page will revalidate and show ConnectedView
    })
  }

  return (
    <div className="space-y-4">
      <Select
        label="Proveedor de inversor"
        options={PROVIDER_OPTIONS}
        value={provider}
        onChange={(e) => {
          setProvider(e.target.value as InverterProvider | '')
          setTestResult(null)
          setError(null)
        }}
      />

      {provider === 'solaredge' && (
        <SolarEdgeFields
          plantId={plantId}
          isPending={isPending}
          onTest={handleTest}
          onSave={handleSave}
          testResult={testResult}
          error={error}
        />
      )}

      {provider === 'huawei' && (
        <HuaweiFields
          plantId={plantId}
          isPending={isPending}
          onTest={handleTest}
          onSave={handleSave}
          testResult={testResult}
          error={error}
        />
      )}
    </div>
  )
}

// ── Provider-specific fields ────────────────────────────────────────────────

interface FieldsProps {
  plantId: string
  isPending: boolean
  onTest: (formData: FormData) => void
  onSave: (formData: FormData) => void
  testResult: { success: boolean; message: string } | null
  error: string | null
}

function SolarEdgeFields({ plantId, isPending, onTest, onSave, testResult, error }: FieldsProps) {
  return (
    <form className="space-y-3">
      <input type="hidden" name="provider" value="solaredge" />
      <input type="hidden" name="plant_id" value={plantId} />

      <Input
        name="api_key"
        label="API Key"
        type="password"
        placeholder="Tu API key de SolarEdge"
        required
      />

      <Input
        name="site_id"
        label="Site ID"
        placeholder="ID del sitio en SolarEdge"
        required
      />

      {testResult && (
        <p className={`text-sm rounded p-2 ${testResult.success ? 'text-success-700 bg-success-50' : 'text-error-600 bg-error-50'}`}>
          {testResult.message}
        </p>
      )}

      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="secondary"
          disabled={isPending}
          formAction={onTest}
        >
          {isPending ? 'Probando...' : 'Probar conexion'}
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isPending || !testResult?.success}
          formAction={onSave}
        >
          {isPending ? 'Guardando...' : 'Guardar integracion'}
        </Button>
      </div>
    </form>
  )
}

function HuaweiFields({ plantId, isPending, onTest, onSave, testResult, error }: FieldsProps) {
  return (
    <form className="space-y-3">
      <input type="hidden" name="provider" value="huawei" />
      <input type="hidden" name="plant_id" value={plantId} />

      <Input
        name="user_name"
        label="Usuario"
        placeholder="Usuario de FusionSolar"
        required
      />

      <Input
        name="system_code"
        label="System Code"
        type="password"
        placeholder="Codigo del sistema"
        required
      />

      <Select
        name="region"
        label="Region"
        options={REGION_OPTIONS}
      />

      {testResult && (
        <p className={`text-sm rounded p-2 ${testResult.success ? 'text-success-700 bg-success-50' : 'text-error-600 bg-error-50'}`}>
          {testResult.message}
        </p>
      )}

      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="secondary"
          disabled={isPending}
          formAction={onTest}
        >
          {isPending ? 'Probando...' : 'Probar conexion'}
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isPending || !testResult?.success}
          formAction={onSave}
        >
          {isPending ? 'Guardando...' : 'Guardar integracion'}
        </Button>
      </div>
    </form>
  )
}
