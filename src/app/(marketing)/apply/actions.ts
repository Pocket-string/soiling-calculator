'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { track } from '@/lib/tracking'
import { leadSchema } from '@/features/leads/types/schemas'
import { createRateLimiter } from '@/lib/rate-limit'

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

  // Notificar admin vía Resend (graceful — no bloquea si falla)
  const resendKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (resendKey && adminEmail) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: 'Soiling Calc <noreply@soilingcalc.com>',
        to: adminEmail,
        subject: `Nueva postulación: ${leadData.name} (${leadData.email})`,
        text: [
          `Nueva postulación recibida:`,
          ``,
          `Nombre: ${leadData.name}`,
          `Email: ${leadData.email}`,
          `País: ${leadData.location_country ?? '—'}`,
          `Ciudad: ${leadData.location_city ?? '—'}`,
          `kWp: ${leadData.system_kwp ?? '—'}`,
          `Inversor: ${leadData.inverter_brand ?? '—'}`,
          `Plataforma actual: ${leadData.inverter_model ?? '—'}`,
          `Frecuencia: ${leadData.reporting_frequency ?? '—'}`,
          `Compromiso 4 semanas: ${leadData.can_commit_weekly ? 'Sí' : 'No'}`,
        ].join('\n'),
      })
    } catch (e) {
      console.warn('[createLead] Resend error (no bloqueante):', e)
    }
  }

  redirect('/thanks')
}
