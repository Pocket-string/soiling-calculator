import { Resend } from 'resend'
import { serverEnv } from '@/lib/env'

// Lazy initialize Resend client to avoid build-time errors
let resendInstance: Resend | null = null

export function getResend(): Resend {
  if (!resendInstance) {
    if (!serverEnv.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    resendInstance = new Resend(serverEnv.RESEND_API_KEY)
  }
  return resendInstance
}

// Email configuration
export const EMAIL_CONFIG = {
  from: serverEnv.RESEND_FROM_EMAIL || 'Soiling Calc <onboarding@resend.dev>',
  replyTo: 'contacto@soilingcalc.com',
}

// ─── Invite Email ──────────────────────────────────────────────────────────────

interface InviteEmailParams {
  to: string
  name: string
  tempPassword: string
  loginUrl: string
}

export async function sendInviteEmail(
  params: InviteEmailParams,
): Promise<{ error: string | null }> {
  try {
    const resend = getResend()

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Tu cuenta de Soiling Calc está lista',
      text: [
        `Hola ${params.name},`,
        ``,
        `Tu cuenta de Soiling Calc ha sido activada. Tienes 30 días de prueba gratuita con acceso completo.`,
        ``,
        `━━━ Tus credenciales ━━━`,
        ``,
        `   Accede aquí: ${params.loginUrl}`,
        `   Email: ${params.to}`,
        `   Contraseña temporal: ${params.tempPassword}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `IMPORTANTE: Cambia tu contraseña después de iniciar sesión.`,
        `Puedes hacerlo en: ${params.loginUrl.replace('/login', '/forgot-password')}`,
        ``,
        `¿Primeros pasos?`,
        `1. Inicia sesión con las credenciales de arriba`,
        `2. Crea tu primera instalación fotovoltaica`,
        `3. Registra tu primera lectura de producción (kWh)`,
        `4. La app calcula automáticamente el soiling y te recomienda cuándo limpiar`,
        ``,
        `Si tienes alguna duda, responde directamente a este email.`,
        ``,
        `— Equipo Soiling Calc`,
      ].join('\n'),
    })

    return { error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { error: message }
  }
}

// ─── Invite Link Email ───────────────────────────────────────────────────────

interface InviteLinkEmailParams {
  to: string
  name: string
  inviteUrl: string
}

export async function sendInviteLinkEmail(
  params: InviteLinkEmailParams,
): Promise<{ error: string | null }> {
  try {
    const resend = getResend()

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Tu acceso a Soiling Calc está listo',
      text: [
        `Hola ${params.name},`,
        ``,
        `Has sido invitado/a a usar Soiling Calc. Tienes 30 días de prueba gratuita con acceso completo.`,
        ``,
        `Para activar tu cuenta, haz clic en el siguiente enlace y elige tu contraseña:`,
        ``,
        `   ${params.inviteUrl}`,
        ``,
        `Este enlace expira en 7 días.`,
        ``,
        `Una vez registrado/a:`,
        `1. Crea tu primera instalación fotovoltaica`,
        `2. Registra tu primera lectura de producción (kWh)`,
        `3. La app calcula automáticamente el soiling y te recomienda cuándo limpiar`,
        ``,
        `Si tienes alguna duda, responde directamente a este email.`,
        ``,
        `-- Equipo Soiling Calc`,
      ].join('\n'),
    })

    return { error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { error: message }
  }
}

// ─── Re-Invite Link Email ────────────────────────────────────────────────────

interface ReinviteLinkEmailParams {
  to: string
  name: string
  inviteUrl: string
  systemKwp?: number | null
  inverterBrand?: string | null
}

export async function sendReinviteLinkEmail(
  params: ReinviteLinkEmailParams,
): Promise<{ error: string | null }> {
  try {
    const resend = getResend()

    const systemLine = params.systemKwp
      ? `Con tu sistema de ${params.systemKwp} kWp${params.inverterBrand ? ` con inversor ${params.inverterBrand}` : ''}, la calculadora de soiling te indica exactamente cuando limpiar tus paneles para maximizar produccion.`
      : 'La calculadora de soiling te indica exactamente cuando limpiar tus paneles para maximizar produccion.'

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `${params.name}, tu nueva invitacion a Soiling Calc`,
      text: [
        `Hola ${params.name},`,
        ``,
        `Te enviamos una nueva invitacion a Soiling Calc. Tu enlace anterior expiro, pero aqui tienes uno nuevo valido por 7 dias.`,
        ``,
        `Activa tu cuenta aqui (solo elige una contrasena):`,
        `   ${params.inviteUrl}`,
        ``,
        systemLine,
        ``,
        `Crear tu cuenta toma menos de 1 minuto.`,
        ``,
        `Si tienes dudas, responde a este email.`,
        ``,
        `-- Equipo Soiling Calc`,
      ].join('\n'),
    })

    return { error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { error: message }
  }
}

// ─── Re-engagement Email ─────────────────────────────────────────────────────

export type ReengagementVariant = 'no_plant' | 'no_readings' | 'inactive'

interface ReengagementEmailParams {
  to: string
  name: string
  variant: ReengagementVariant
  /** Only needed for 'no_readings' variant */
  plantName?: string
  plantUrl?: string
  siteUrl: string
}

const REENGAGEMENT_SUBJECTS: Record<ReengagementVariant, string> = {
  no_plant: 'Tu planta solar espera ser configurada',
  no_readings: 'Registra tu primera lectura',
  inactive: 'Tus datos de irradiancia se actualizan a diario',
}

function buildReengagementBody(params: ReengagementEmailParams): string {
  const { name, variant, plantName, plantUrl, siteUrl } = params
  const plantsUrl = `${siteUrl}/plants`

  const bodies: Record<ReengagementVariant, string[]> = {
    no_plant: [
      `Hola ${name},`,
      ``,
      `Creaste tu cuenta en Soiling Calc pero aun no has configurado tu primera planta.`,
      ``,
      `Solo toma 2 minutos:`,
      `1. Ingresa los datos basicos de tu instalacion (kWp, ubicacion)`,
      `2. Registra una lectura de produccion`,
      `3. La app calcula automaticamente el soiling y el momento optimo de limpieza`,
      ``,
      `Configura tu planta ahora:`,
      `   ${plantsUrl}`,
      ``,
      `Si tienes dudas sobre que datos necesitas, responde a este email.`,
      ``,
      `-- Equipo Soiling Calc`,
    ],
    no_readings: [
      `Hola ${name},`,
      ``,
      `Tu planta "${plantName ?? 'tu instalacion'}" esta lista pero aun no tiene lecturas registradas.`,
      ``,
      `Para que la calculadora de soiling funcione, necesita al menos una lectura de produccion (kWh del dia).`,
      ``,
      `Registra tu primera lectura ahora:`,
      `   ${plantUrl ?? plantsUrl}`,
      ``,
      `Los datos que necesitas:`,
      `- Produccion del dia (kWh) — lo encuentras en tu inversor o plataforma de monitoreo`,
      `- Fecha de la lectura`,
      ``,
      `Si no sabes donde encontrar estos datos, respondenos y te ayudamos.`,
      ``,
      `-- Equipo Soiling Calc`,
    ],
    inactive: [
      `Hola ${name},`,
      ``,
      `Hace tiempo que no entras a Soiling Calc.`,
      ``,
      `Mientras tanto, los datos de irradiancia de tu zona se actualizan automaticamente cada dia. Cuantas mas lecturas registres, mas preciso sera el calculo de soiling de tu planta.`,
      ``,
      `Vuelve a revisar tu instalacion:`,
      `   ${plantsUrl}`,
      ``,
      `Recuerda: tu periodo de prueba sigue corriendo. Aprovechalo para evaluar si la herramienta te es util.`,
      ``,
      `Si necesitas ayuda o tienes feedback, respondenos.`,
      ``,
      `-- Equipo Soiling Calc`,
    ],
  }

  return bodies[variant].join('\n')
}

export async function sendReengagementEmail(
  params: ReengagementEmailParams,
): Promise<{ error: string | null }> {
  try {
    const resend = getResend()

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: REENGAGEMENT_SUBJECTS[params.variant],
      text: buildReengagementBody(params),
    })

    return { error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { error: message }
  }
}

// ─── Soiling Alert Email ──────────────────────────────────────────────────────

const RECOMMENDATION_LABELS: Record<string, string> = {
  WATCH: 'Vigilar',
  RECOMMENDED: 'Limpieza recomendada',
  URGENT: 'Limpieza urgente',
}

interface SoilingAlertEmailParams {
  to: string
  plantName: string
  soilingPercent: number
  recommendation: string
  cumulativeLossEur: number
  currency: string
  daysToBreakeven: number | null
  readingDate: string
  plantUrl: string
}

export async function sendSoilingAlertEmail(
  params: SoilingAlertEmailParams,
): Promise<{ error: string | null }> {
  try {
    const resend = getResend()
    const recLabel = RECOMMENDATION_LABELS[params.recommendation] ?? params.recommendation
    const breakevenLine = params.daysToBreakeven != null
      ? `   Dias hasta break-even: ${params.daysToBreakeven}`
      : `   Break-even: ya superado — limpiar cuanto antes`

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `[Soiling ${params.soilingPercent.toFixed(1)}%] ${params.plantName} — ${recLabel}`,
      text: [
        `Alerta de soiling para tu planta "${params.plantName}":`,
        ``,
        `━━━ Resumen ━━━`,
        ``,
        `   Soiling actual: ${params.soilingPercent.toFixed(1)}%`,
        `   Recomendacion: ${recLabel}`,
        `   Perdida acumulada: ${params.cumulativeLossEur.toFixed(2)} ${params.currency}`,
        breakevenLine,
        `   Fecha lectura: ${params.readingDate}`,
        ``,
        `━━━━━━━━━━━━━━━`,
        ``,
        `Ver detalle de la planta:`,
        `   ${params.plantUrl}`,
        ``,
        `Puedes ajustar los umbrales de alerta en Configuracion > Alertas por Email.`,
        ``,
        `— Soiling Calc`,
      ].join('\n'),
    })

    return { error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { error: message }
  }
}
