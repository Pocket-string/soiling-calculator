'use server'

import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReengagementEmail, type ReengagementVariant } from '@/lib/email/resend'
import { track, EVENTS } from '@/lib/tracking'
import { serverEnv } from '@/lib/env'

// ── Types ────────────────────────────────────────────────────────────────────

export type EngagementStatus = 'active' | 'stalled' | 'dormant' | 'churning'

export interface UserEngagement {
  userId: string
  email: string
  fullName: string | null
  accessLevel: string
  lastSignInAt: string | null
  trialEndsAt: string | null
  trialDaysLeft: number | null
  plantCount: number
  readingCount: number
  lastReadingDate: string | null
  systemKwp: number | null
  inverterBrand: string | null
  engagementStatus: EngagementStatus
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function computeStatus(
  lastLoginDays: number | null,
  trialDaysLeft: number | null,
  plantCount: number,
  readingCount: number,
): EngagementStatus {
  // Churning: trial almost over and no readings
  if (trialDaysLeft !== null && trialDaysLeft < 7 && readingCount === 0) {
    return 'churning'
  }
  // Dormant: hasn't logged in for 7+ days
  if (lastLoginDays !== null && lastLoginDays >= 7) {
    return 'dormant'
  }
  // Active: logged in recently AND has plant with readings
  if (lastLoginDays !== null && lastLoginDays < 3 && plantCount > 0 && readingCount > 0) {
    return 'active'
  }
  // Stalled: everything else (logged in but not progressing)
  return 'stalled'
}

// ── Main Action ──────────────────────────────────────────────────────────────

export async function getUserEngagement(): Promise<UserEngagement[]> {
  await requireAdmin()
  const supabase = createServiceClient()

  // 1. Fetch auth users (admin API gives us last_sign_in_at)
  const { data: authResult } = await supabase.auth.admin.listUsers({ perPage: 100 })
  const authUsers = authResult?.users ?? []

  // 2. Fetch profiles (founding + paid only, skip admin accounts)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, access_level, trial_ends_at')
    .in('access_level', ['founding', 'paid', 'free'])

  if (!profiles || profiles.length === 0) return []

  // 3. Fetch plant counts per user
  const { data: plantCounts } = await supabase
    .from('plants')
    .select('user_id, id')

  const plantMap = new Map<string, number>()
  for (const p of plantCounts ?? []) {
    plantMap.set(p.user_id, (plantMap.get(p.user_id) ?? 0) + 1)
  }

  // 4. Fetch reading counts per user (via plants)
  const { data: readings } = await supabase
    .from('production_readings')
    .select('user_id, reading_date')
    .order('reading_date', { ascending: false })

  const readingMap = new Map<string, { count: number; lastDate: string | null }>()
  for (const r of readings ?? []) {
    const existing = readingMap.get(r.user_id)
    if (existing) {
      existing.count++
    } else {
      readingMap.set(r.user_id, { count: 1, lastDate: r.reading_date })
    }
  }

  // 5. Fetch leads to cross-reference system_kwp and inverter_brand by email
  const { data: leads } = await supabase
    .from('leads')
    .select('email, system_kwp, inverter_brand')

  const leadMap = new Map<string, { systemKwp: number | null; inverterBrand: string | null }>()
  for (const l of leads ?? []) {
    leadMap.set(l.email, {
      systemKwp: l.system_kwp ? Number(l.system_kwp) : null,
      inverterBrand: l.inverter_brand,
    })
  }

  // 6. Build engagement list
  const authMap = new Map(authUsers.map((u) => [u.id, u]))

  return profiles.map((profile) => {
    const auth = authMap.get(profile.id)
    const email = auth?.email ?? ''
    const lastLoginDays = daysSince(auth?.last_sign_in_at ?? null)
    const trialDaysLeft = daysUntil(profile.trial_ends_at)
    const plantCount = plantMap.get(profile.id) ?? 0
    const readingInfo = readingMap.get(profile.id)
    const readingCount = readingInfo?.count ?? 0
    const leadInfo = leadMap.get(email)

    return {
      userId: profile.id,
      email,
      fullName: profile.full_name,
      accessLevel: profile.access_level,
      lastSignInAt: auth?.last_sign_in_at ?? null,
      trialEndsAt: profile.trial_ends_at,
      trialDaysLeft,
      plantCount,
      readingCount,
      lastReadingDate: readingInfo?.lastDate ?? null,
      systemKwp: leadInfo?.systemKwp ?? null,
      inverterBrand: leadInfo?.inverterBrand ?? null,
      engagementStatus: computeStatus(lastLoginDays, trialDaysLeft, plantCount, readingCount),
    }
  })
}

// ── Send Nudge Email ─────────────────────────────────────────────────────────

export async function sendNudgeEmail(
  userId: string,
  variant: ReengagementVariant,
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL

  // Get user data
  const { data: authResult } = await supabase.auth.admin.getUserById(userId)
  const user = authResult?.user
  if (!user?.email) return { error: 'Usuario no encontrado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  const name = profile?.full_name ?? user.email.split('@')[0]

  // For no_readings variant, get plant info
  let plantName: string | undefined
  let plantUrl: string | undefined
  if (variant === 'no_readings') {
    const { data: plant } = await supabase
      .from('plants')
      .select('id, name')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (plant) {
      plantName = plant.name
      plantUrl = `${siteUrl}/plants/${plant.id}`
    }
  }

  // Check cooldown (48h) via funnel_events
  const { data: recentEvent } = await supabase
    .from('funnel_events')
    .select('id')
    .eq('event_name', EVENTS.REENGAGEMENT_SENT)
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle()

  if (recentEvent) {
    return { error: 'Email de re-engagement ya enviado en las ultimas 48h' }
  }

  // Send email
  const result = await sendReengagementEmail({
    to: user.email,
    name,
    variant,
    plantName,
    plantUrl,
    siteUrl,
  })

  if (result.error) return { error: result.error }

  // Track event (also serves as cooldown log)
  track({
    event: EVENTS.REENGAGEMENT_SENT,
    userId,
    metadata: { variant, email: user.email },
  })

  return {}
}

// ── Bulk Re-engagement ───────────────────────────────────────────────────────

export async function sendBulkReengagement(): Promise<{
  sent: number
  skipped: number
  errors: number
}> {
  await requireAdmin()

  const users = await getUserEngagement()
  let sent = 0
  let skipped = 0
  let errors = 0

  for (const user of users) {
    // Skip active users
    if (user.engagementStatus === 'active') {
      skipped++
      continue
    }

    // Determine variant
    let variant: ReengagementVariant
    if (user.plantCount === 0) {
      variant = 'no_plant'
    } else if (user.readingCount === 0) {
      variant = 'no_readings'
    } else {
      variant = 'inactive'
    }

    const result = await sendNudgeEmail(user.userId, variant)
    if (result.error) {
      // Cooldown hit counts as skipped, not error
      if (result.error.includes('48h')) {
        skipped++
      } else {
        errors++
      }
    } else {
      sent++
    }
  }

  return { sent, skipped, errors }
}
