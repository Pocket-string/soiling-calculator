/**
 * send-reengagement.js
 *
 * One-time script: extends pending invite expiration (+14 days)
 * and sends a re-engagement email to each user.
 *
 * Usage:
 *   node --env-file=.env.local scripts/send-reengagement.js --dry-run   # preview only
 *   node --env-file=.env.local scripts/send-reengagement.js             # send emails
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   RESEND_API_KEY, RESEND_FROM_EMAIL, NEXT_PUBLIC_SITE_URL
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ── Env validation ───────────────────────────────────────────────────────────

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SITE_URL',
]

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}`)
    process.exit(1)
  }
}

const DRY_RUN = process.argv.includes('--dry-run')
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Soiling Calc <onboarding@resend.dev>'
const REPLY_TO = process.env.ADMIN_EMAIL || 'hola@soilingcalc.com'

// ── Clients ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '\n=== DRY RUN (no emails will be sent) ===\n' : '\n=== SENDING EMAILS ===\n')

  // 1. Fetch pending invites
  const { data: invites, error } = await supabase
    .from('invites')
    .select('id, token, email, name, status, expires_at')
    .eq('status', 'pending')
    .order('created_at')

  if (error) {
    console.error('Error fetching invites:', error.message)
    process.exit(1)
  }

  if (!invites || invites.length === 0) {
    console.log('No pending invites found.')
    return
  }

  console.log(`Found ${invites.length} pending invites:\n`)

  let sent = 0
  let failed = 0

  for (const invite of invites) {
    const inviteUrl = `${SITE_URL}/invite/${invite.token}`
    const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    const expiryFormatted = newExpiry.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    console.log(`  ${invite.name} <${invite.email}>`)
    console.log(`    Invite URL: ${inviteUrl}`)
    console.log(`    New expiry: ${expiryFormatted}`)

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Skipping send & update\n`)
      sent++
      continue
    }

    // 2. Extend expiration
    const { error: updateError } = await supabase
      .from('invites')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('id', invite.id)

    if (updateError) {
      console.log(`    [ERROR] Failed to extend expiry: ${updateError.message}\n`)
      failed++
      continue
    }

    // 3. Send re-engagement email
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invite.email,
        replyTo: REPLY_TO,
        subject: 'Tu acceso a Soiling Calc sigue disponible',
        text: [
          `Hola ${invite.name},`,
          ``,
          `Te escribimos porque hace unos dias te enviamos una invitacion para acceder a Soiling Calc, nuestra plataforma de monitoreo de soiling fotovoltaico, y notamos que aun no has activado tu cuenta.`,
          ``,
          `Queremos asegurarnos de que todo este bien. Si tuviste algun problema al acceder o tienes alguna duda, responde a este correo y te ayudamos.`,
          ``,
          `Tu enlace de activacion sigue activo:`,
          ``,
          `   ${inviteUrl}`,
          ``,
          `Con tu cuenta podras:`,
          `- Registrar tus plantas fotovoltaicas`,
          `- Calcular perdidas por soiling con datos de irradiancia reales`,
          `- Recibir recomendaciones de limpieza con analisis costo-beneficio`,
          `- Integrar inversores SolarEdge y Huawei para sincronizacion automatica`,
          ``,
          `El enlace expira el ${expiryFormatted}. Si necesitas uno nuevo, solo respondenos.`,
          ``,
          `Saludos,`,
          `Equipo Soiling Calc`,
        ].join('\n'),
      })

      console.log(`    [OK] Email sent + expiry extended\n`)
      sent++
    } catch (e) {
      console.log(`    [ERROR] Email failed: ${e.message}\n`)
      failed++
    }
  }

  console.log(`\n=== Results ===`)
  console.log(`  Sent: ${sent}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total: ${invites.length}`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
