import { z } from 'zod'

/**
 * Validación centralizada de variables de entorno con Zod.
 *
 * Server-side: se evalúa al importar — falla rápido si falta algo crítico.
 * Client-side: solo expone variables NEXT_PUBLIC_*.
 */

// --- Schema ---

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
  INTEGRATION_ENCRYPTION_KEY: z.string().length(64, 'Must be 32-byte hex (64 chars)').optional(),
  CRON_SECRET: z.string().min(32, 'CRON_SECRET must be at least 32 chars').optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
})

// --- Parsing ---

type ServerEnv = z.infer<typeof serverSchema>
type ClientEnv = z.infer<typeof clientSchema>

function parseServerEnv(): ServerEnv {
  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Variables de entorno inválidas:\n${formatted}`)
  }
  return result.data
}

function parseClientEnv(): ClientEnv {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  })
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Variables de entorno (client) inválidas:\n${formatted}`)
  }
  return result.data
}

// --- Exports ---

/**
 * Server-only env vars. Import this in Server Components, Actions, API routes.
 * Will throw at import time if required vars are missing.
 */
export const serverEnv: ServerEnv =
  typeof window === 'undefined'
    ? parseServerEnv()
    : (new Proxy({} as ServerEnv, {
        get() {
          throw new Error('serverEnv no puede usarse en el cliente')
        },
      }))

/**
 * Client-safe env vars (only NEXT_PUBLIC_*).
 * Safe to import anywhere.
 */
export const clientEnv: ClientEnv = parseClientEnv()
