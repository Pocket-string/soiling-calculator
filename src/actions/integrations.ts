'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/auth'
import { integrationConfigSchema } from '@/features/integrations/types/schemas'
import { encryptCredentials, decryptCredentials } from '@/features/integrations/services/crypto'
import { fetchInverterReadings, testInverterConnection } from '@/features/integrations/services/inverterClientFactory'
import { processReading } from '@/features/soiling/services/readingPipeline'
import { getOrFetchIrradiance } from '@/features/irradiance/services/irradianceService'
import type { InverterIntegration, InverterProvider, SolarEdgeCredentials, HuaweiCredentials } from '@/features/integrations/types'
import type { Plant } from '@/features/plants/types'

// ── Helpers ─────────────────────────────────────────────────────────────────

function credentialsToRecord(
  provider: InverterProvider,
  config: Record<string, unknown>,
): Record<string, string> {
  if (provider === 'solaredge') {
    return { apiKey: String(config.api_key), siteId: String(config.site_id) }
  }
  return {
    userName: String(config.user_name),
    systemCode: String(config.system_code),
    region: String(config.region),
  }
}

function recordToCredentials(
  provider: InverterProvider,
  record: Record<string, string>,
): SolarEdgeCredentials | HuaweiCredentials {
  if (provider === 'solaredge') {
    return { apiKey: record.apiKey, siteId: record.siteId }
  }
  return {
    userName: record.userName,
    systemCode: record.systemCode,
    region: record.region as 'eu5' | 'intl' | 'la5',
  }
}

// ── Actions ─────────────────────────────────────────────────────────────────

/**
 * Test connection to an inverter API without saving credentials.
 */
export async function testIntegration(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const raw = Object.fromEntries(formData)
  const parsed = integrationConfigSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const config = parsed.data
  const credRecord = credentialsToRecord(config.provider, config)
  const credentials = recordToCredentials(config.provider, credRecord)

  try {
    const result = await testInverterConnection(config.provider, credentials)
    if (!result.success) {
      return { error: result.error ?? 'Connection test failed' }
    }
    return { data: { success: true, metadata: result.metadata } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Connection test failed' }
  }
}

/**
 * Save (create/update) an inverter integration for a plant.
 * Encrypts credentials before storage.
 */
export async function saveIntegration(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const trialError = await requireActiveSubscription(user.id)
  if (trialError) return { error: trialError }

  const raw = Object.fromEntries(formData)
  const plantId = raw.plant_id as string
  if (!plantId) return { error: 'plant_id es requerido' }

  const parsed = integrationConfigSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const config = parsed.data

  // Verify plant ownership
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) return { error: 'Planta no encontrada o sin acceso' }

  // Encrypt credentials
  const credRecord = credentialsToRecord(config.provider, config)
  const { encrypted, iv, tag } = encryptCredentials(credRecord)

  // Determine external_site_id (non-secret identifier for the external system)
  const externalSiteId = config.provider === 'solaredge'
    ? config.site_id
    : (raw.external_site_id as string | undefined) ?? null

  // Upsert (one integration per plant)
  const { data: integration, error: upsertError } = await supabase
    .from('inverter_integrations')
    .upsert(
      {
        plant_id: plantId,
        user_id: user.id,
        provider: config.provider,
        credentials_encrypted: encrypted,
        credentials_iv: iv,
        credentials_tag: tag,
        external_site_id: externalSiteId,
        is_active: true,
        sync_enabled: false,
        consecutive_failures: 0,
        last_sync_error: null,
      },
      { onConflict: 'plant_id' },
    )
    .select('id, plant_id, provider, external_site_id, is_active, sync_enabled, last_sync_at, last_sync_status, created_at, updated_at')
    .single()

  if (upsertError) return { error: upsertError.message }

  revalidatePath(`/plants/${plantId}/settings`)
  return { data: integration }
}

/**
 * Remove (soft delete) an inverter integration.
 */
export async function removeIntegration(plantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('inverter_integrations')
    .update({ is_active: false, sync_enabled: false })
    .eq('plant_id', plantId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/plants/${plantId}/settings`)
  return { success: true }
}

/**
 * Toggle automatic sync on/off for an integration.
 */
export async function toggleSync(plantId: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('inverter_integrations')
    .update({ sync_enabled: enabled })
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) return { error: error.message }

  revalidatePath(`/plants/${plantId}/settings`)
  return { success: true }
}

/**
 * Manually sync readings for the last 7 days, skipping dates with existing readings.
 */
export async function manualSync(plantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const trialError = await requireActiveSubscription(user.id)
  if (trialError) return { error: trialError }

  // 1. Fetch integration with ownership check
  const { data: integration, error: intError } = await supabase
    .from('inverter_integrations')
    .select('*')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (intError || !integration) return { error: 'Integracion no encontrada' }

  // 2. Fetch plant config
  const { data: plantRow, error: plantError } = await supabase
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plantRow) return { error: 'Planta no encontrada' }

  const plant = plantRow as Plant

  // 3. Decrypt credentials
  let credentials
  try {
    const credRecord = decryptCredentials(
      integration.credentials_encrypted,
      integration.credentials_iv,
      integration.credentials_tag,
    )
    credentials = recordToCredentials(integration.provider as InverterProvider, credRecord)
  } catch {
    return { error: 'Error al desencriptar credenciales. Reconfigura la integracion.' }
  }

  // 4. Date range: last 7 days (or from last_sync_at)
  const endDate = new Date()
  endDate.setUTCDate(endDate.getUTCDate() - 1) // Yesterday (today may be incomplete)
  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - 6) // 7 days total

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  // 5. Fetch readings from inverter API
  let inverterReadings
  try {
    inverterReadings = await fetchInverterReadings(
      integration.provider as InverterProvider,
      credentials,
      integration.external_site_id ?? '',
      startStr,
      endStr,
    )
  } catch (err) {
    // Update failure state
    await supabase
      .from('inverter_integrations')
      .update({
        last_sync_status: 'error',
        last_sync_error: err instanceof Error ? err.message : 'Fetch failed',
        consecutive_failures: (integration.consecutive_failures ?? 0) + 1,
      })
      .eq('id', integration.id)

    return { error: err instanceof Error ? err.message : 'Error al obtener datos del inversor' }
  }

  // 6. Check which dates already have readings
  const { data: existingRows } = await supabase
    .from('production_readings')
    .select('reading_date')
    .eq('plant_id', plantId)
    .gte('reading_date', startStr)
    .lte('reading_date', endStr)

  const existingDates = new Set((existingRows ?? []).map((r) => r.reading_date))

  // 7. Process each new reading through the soiling pipeline
  let synced = 0
  let skipped = 0
  let errors = 0

  for (const reading of inverterReadings) {
    if (existingDates.has(reading.date)) {
      skipped++
      continue
    }

    try {
      const irradianceData = await getOrFetchIrradiance(
        plant.latitude,
        plant.longitude,
        reading.date,
        plant.tilt_degrees,
      )

      await processReading({
        plant,
        userId: user.id,
        readingDate: reading.date,
        kwhReal: reading.kwh_real,
        readingType: 'AUTOMATIC',
        isCleaningDay: false,
        irradianceData,
        supabase,
      })

      synced++
    } catch (err) {
      console.warn(`[sync] Failed to process ${reading.date}:`, err)
      errors++
    }
  }

  // 8. Update sync status
  const status = errors > 0 ? (synced > 0 ? 'partial' : 'error') : 'success'
  await supabase
    .from('inverter_integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: status,
      last_sync_error: errors > 0 ? `${errors} readings failed` : null,
      last_sync_readings_count: synced,
      consecutive_failures: status === 'error' ? (integration.consecutive_failures ?? 0) + 1 : 0,
    })
    .eq('id', integration.id)

  revalidatePath(`/plants/${plantId}`)
  revalidatePath(`/plants/${plantId}/settings`)
  return { data: { synced, skipped, errors } }
}

/**
 * Get integration metadata for a plant (never returns credentials).
 */
export async function getIntegration(plantId: string): Promise<{
  data: InverterIntegration | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autorizado' }

  const { data, error } = await supabase
    .from('inverter_integrations')
    .select('id, plant_id, user_id, provider, external_site_id, is_active, sync_enabled, last_sync_at, last_sync_status, last_sync_error, last_sync_readings_count, consecutive_failures, next_sync_after, created_at, updated_at')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) return { data: null, error: error.message }

  return { data: data as InverterIntegration | null, error: null }
}
