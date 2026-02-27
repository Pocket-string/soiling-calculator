'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { track } from '@/lib/tracking'
import { leadSchema } from '@/features/leads/types/schemas'
import { createRateLimiter } from '@/lib/rate-limit'
import { serverEnv } from '@/lib/env'
import { calculateLeadScore, getScoreTier, SCORE_TIER_LABELS } from '@/features/leads/services/leadScorer'

const checkRateLimit = createRateLimiter(3, 15 * 60 * 1000) // 3 req / 15 min

type FormState = { error: Record<string, string[]> | string | null }

export async function createLead(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Rate limit by IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || 'unknown'

  if (!checkRateLimit(ip)) {
    return { error: 'Demasiadas solicitudes. Espera unos minutos e intentalo de nuevo.' }
  }

  const raw = Object.fromEntries(formData)
  const parsed = leadSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gdpr_consent: _gdpr, ...leadData } = parsed.data

  const supabase = createServiceClient()

  // Verificar cuota: si hay >= 10 leads activos/invitados → waitlist
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .in('status', ['invited', 'active'])

  if ((count ?? 0) >= 10) {
    redirect('/waitlist')
  }

  // Upsert por email (actualiza si ya existe, no duplica)
  const { error } = await supabase
    .from('leads')
    .upsert({ ...leadData, status: 'applied' }, { onConflict: 'email' })

  if (error) {
    console.error('[createLead] Supabase error:', error)
    return { error: 'Error al guardar tu solicitud. Por favor, inténtalo de nuevo.' }
  }

  // Track funnel event
  track({ event: 'LEAD_APPLIED', metadata: { email: leadData.email, name: leadData.name }, ip })

  // Compute score for notification
  const score = calculateLeadScore(leadData)
  const tier = getScoreTier(score.total)
  const tierLabel = SCORE_TIER_LABELS[tier]
  const adminUrl = `${serverEnv.NEXT_PUBLIC_SITE_URL}/panel/leads`

  // Notificar admin vía Resend (graceful — no bloquea si falla)
  if (serverEnv.RESEND_API_KEY && serverEnv.ADMIN_EMAIL) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(serverEnv.RESEND_API_KEY)
      await resend.emails.send({
        from: serverEnv.RESEND_FROM_EMAIL || 'Soiling Calc <onboarding@resend.dev>',
        to: serverEnv.ADMIN_EMAIL,
        subject: `[Score ${score.total}/100 — ${tierLabel}] Nueva postulación: ${leadData.name}`,
        text: [
          `Nueva postulación recibida:`,
          ``,
          `━━━ Score: ${score.total}/100 (${tierLabel}) ━━━`,
          `  Compromiso semanal: ${score.commitment}/30`,
          `  Inversor: ${score.inverter}/25`,
          `  Tamaño sistema: ${score.systemSize}/15`,
          `  Frecuencia reporte: ${score.frequency}/20`,
          `  Ubicación completa: ${score.location}/10`,
          ``,
          `━━━ Datos del lead ━━━`,
          `  Nombre: ${leadData.name}`,
          `  Email: ${leadData.email}`,
          `  País: ${leadData.location_country ?? '—'}`,
          `  Ciudad: ${leadData.location_city ?? '—'}`,
          `  kWp: ${leadData.system_kwp ?? '—'}`,
          `  Inversor: ${leadData.inverter_brand ?? '—'}`,
          `  Plataforma: ${leadData.inverter_model ?? '—'}`,
          `  Frecuencia: ${leadData.reporting_frequency ?? '—'}`,
          `  Compromiso 4 semanas: ${leadData.can_commit_weekly ? 'Sí' : 'No'}`,
          ``,
          score.total >= 60
            ? `⚡ Lead calificado — invitar pronto`
            : `📋 Lead registrado — revisar manualmente`,
          ``,
          `Gestionar leads: ${adminUrl}`,
        ].join('\n'),
      })
    } catch (e) {
      console.warn('[createLead] Resend error (no bloqueante):', e)
    }
  }

  redirect('/thanks')
}
