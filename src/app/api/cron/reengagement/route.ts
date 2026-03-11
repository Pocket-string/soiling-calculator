import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReengagementEmail, type ReengagementVariant } from '@/lib/email/resend'
import { track, EVENTS } from '@/lib/tracking'
import { serverEnv } from '@/lib/env'
import { createRateLimiter } from '@/lib/rate-limit'

const cronLimiter = createRateLimiter(1, 60 * 60 * 1000) // 1 per hour

export async function GET(request: NextRequest) {
  // Auth: Bearer CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!serverEnv.CRON_SECRET || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!cronLimiter('cron-reengagement')) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const supabase = createServiceClient()
  const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL

  // 1. Fetch all founding users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, trial_ends_at')
    .in('access_level', ['founding', 'paid', 'free'])

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: 0, reason: 'no_users' })
  }

  // 2. Fetch auth users for email
  const { data: authResult } = await supabase.auth.admin.listUsers({ perPage: 100 })
  const authMap = new Map((authResult?.users ?? []).map((u) => [u.id, u]))

  // 3. Fetch plant and reading counts
  const { data: plants } = await supabase.from('plants').select('user_id, id, name')
  const plantMap = new Map<string, { count: number; firstName: string; firstId: string }>()
  for (const p of plants ?? []) {
    const existing = plantMap.get(p.user_id)
    if (existing) {
      existing.count++
    } else {
      plantMap.set(p.user_id, { count: 1, firstName: p.name, firstId: p.id })
    }
  }

  const { data: readings } = await supabase.from('production_readings').select('user_id')
  const readingMap = new Map<string, number>()
  for (const r of readings ?? []) {
    readingMap.set(r.user_id, (readingMap.get(r.user_id) ?? 0) + 1)
  }

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const profile of profiles) {
    const auth = authMap.get(profile.id)
    if (!auth?.email) { skipped++; continue }

    const signupDays = Math.floor((Date.now() - new Date(auth.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const lastLoginDays = auth.last_sign_in_at
      ? Math.floor((Date.now() - new Date(auth.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
      : signupDays

    const plantInfo = plantMap.get(profile.id)
    const readingCount = readingMap.get(profile.id) ?? 0

    // Determine if user needs a nudge and which variant
    let variant: ReengagementVariant | null = null

    if (!plantInfo && signupDays >= 2) {
      variant = 'no_plant'
    } else if (plantInfo && readingCount === 0 && signupDays >= 7) {
      variant = 'no_readings'
    } else if (lastLoginDays >= 7 && readingCount > 0) {
      variant = 'inactive'
    }

    if (!variant) { skipped++; continue }

    // Check cooldown (7 days between cron-sent emails per user)
    const { data: recentEvent } = await supabase
      .from('funnel_events')
      .select('id')
      .eq('event_name', EVENTS.REENGAGEMENT_SENT)
      .eq('user_id', profile.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle()

    if (recentEvent) { skipped++; continue }

    // Send
    const name = profile.full_name ?? auth.email.split('@')[0]
    const result = await sendReengagementEmail({
      to: auth.email,
      name,
      variant,
      plantName: plantInfo?.firstName,
      plantUrl: plantInfo ? `${siteUrl}/plants/${plantInfo.firstId}` : undefined,
      siteUrl,
    })

    if (result.error) {
      errors++
    } else {
      track({
        event: EVENTS.REENGAGEMENT_SENT,
        userId: profile.id,
        metadata: { variant, email: auth.email, source: 'cron' },
      })
      sent++
    }
  }

  return NextResponse.json({ sent, skipped, errors })
}
