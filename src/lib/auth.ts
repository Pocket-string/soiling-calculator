import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'
import type { Profile } from '@/features/invites/types'

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
