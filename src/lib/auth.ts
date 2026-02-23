import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'
import type { Profile } from '@/features/invites/types'
import { createHash } from 'crypto'

/** Verifica sesión activa. Si no hay sesión, redirige a /login. */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

/** Obtiene el profile del usuario actual (service client para bypass RLS). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  return (data as Profile | null) ?? null
}

/** Verifica sesión activa + rol admin. Si no cumple, redirige. */
export async function requireAdmin() {
  const user = await requireAuth()

  // Check profiles table first
  const profile = await getProfile(user.id)
  if (profile?.access_level === 'admin') return user

  // Fallback: email-based check (for bootstrapping)
  if (serverEnv.ADMIN_EMAIL && user.email === serverEnv.ADMIN_EMAIL) return user

  redirect('/plants')
}

/** Obtiene el usuario actual sin redirigir (puede ser null). */
export async function getOptionalUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Verifica si la suscripción está activa. Retorna null si OK, o mensaje de error. */
export async function requireActiveSubscription(userId: string): Promise<string | null> {
  const profile = await getProfile(userId)
  if (!profile) return null
  if (profile.access_level === 'admin' || profile.access_level === 'paid') return null
  if (profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) {
    return 'Tu período de prueba ha expirado. Contáctanos para continuar.'
  }
  return null
}

/** Verifica si el trial del usuario actual ha expirado (reads from profiles). */
export async function checkTrialStatus(): Promise<{ expired: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { expired: false }

  const profile = await getProfile(user.id)
  if (!profile) return { expired: false }

  // Admin and paid users never expire
  if (profile.access_level === 'admin' || profile.access_level === 'paid') {
    return { expired: false }
  }

  return {
    expired: !!profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date(),
  }
}

// ── API Key Authentication ─────────────────────────────────────────────────

/** SHA-256 hash using Node.js crypto (no external deps). */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

interface ApiKeyAuth {
  userId: string
  scopes: string[]
}

/**
 * Authenticates a request using an API key (Bearer sk_live_...).
 * Returns the associated userId and scopes, or null if invalid.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer sk_')) return null

  const rawKey = authHeader.slice(7) // remove "Bearer "
  const keyHash = sha256(rawKey)

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('api_keys')
    .select('user_id, scopes, is_active')
    .eq('key_hash', keyHash)
    .single()

  if (!data || !data.is_active) return null

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
    .then(() => {})

  return {
    userId: data.user_id as string,
    scopes: data.scopes as string[],
  }
}
