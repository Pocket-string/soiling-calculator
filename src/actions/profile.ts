'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// ── Types ────────────────────────────────────────────────────────────────────

interface ActionState {
  error: string | null
  success: boolean
  fieldErrors: Record<string, string[]>
}

// ── Update Profile ───────────────────────────────────────────────────────────

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth()

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
  })

  if (!parsed.success) {
    return {
      error: null,
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.full_name, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    return { error: error.message, success: false, fieldErrors: {} }
  }

  revalidatePath('/settings')
  return { error: null, success: true, fieldErrors: {} }
}

// ── Change Password ──────────────────────────────────────────────────────────

export async function changePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth()

  const parsed = passwordSchema.safeParse({
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      error: null,
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Use user client (not service) so auth context is correct
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message, success: false, fieldErrors: {} }
  }

  return { error: null, success: true, fieldErrors: {} }
}
