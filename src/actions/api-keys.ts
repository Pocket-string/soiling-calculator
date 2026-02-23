'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { sha256 } from '@/lib/auth'

export interface ApiKeyInfo {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

/** List all API keys for the authenticated user. */
export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as ApiKeyInfo[]
}

/**
 * Create a new API key. Returns the full key (shown only once) + metadata.
 * The key is stored as a SHA-256 hash — the raw key cannot be recovered.
 */
export async function createApiKey(
  name: string,
): Promise<{ key: string; info: ApiKeyInfo } | { error: string }> {
  const user = await requireAuth()
  const supabase = await createClient()

  if (!name || name.trim().length < 2) {
    return { error: 'El nombre debe tener al menos 2 caracteres' }
  }

  // Limit: max 5 active keys per user
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)

  if ((count ?? 0) >= 5) {
    return { error: 'Maximo 5 API keys activas por usuario' }
  }

  // Generate key: sk_live_ + 32 random hex chars
  const rawKey = 'sk_live_' + randomBytes(16).toString('hex')
  const keyHash = sha256(rawKey)
  const keyPrefix = rawKey.slice(0, 16) + '...'

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id, name, key_prefix, scopes, is_active, last_used_at, created_at')
    .single()

  if (error) {
    console.error('[createApiKey]', error)
    return { error: 'Error al crear API key' }
  }

  revalidatePath('/settings')

  return {
    key: rawKey,
    info: data as ApiKeyInfo,
  }
}

/** Revoke an API key (soft delete — marks as inactive). */
export async function revokeApiKey(keyId: string): Promise<{ error: string | null }> {
  const user = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[revokeApiKey]', error)
    return { error: 'Error al revocar API key' }
  }

  revalidatePath('/settings')
  return { error: null }
}
