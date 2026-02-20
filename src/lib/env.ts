/**
 * Validación centralizada de variables de entorno.
 * Se evalúa al importar — falla rápido si falta algo crítico.
 */

const required = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

for (const [key, value] of Object.entries(required)) {
  if (!value) {
    throw new Error(`Variable de entorno requerida no configurada: ${key}`)
  }
}

const optional = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
}

for (const [key, value] of Object.entries(optional)) {
  if (!value) {
    console.warn(`[env] Variable opcional no configurada: ${key}`)
  }
}

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
}
