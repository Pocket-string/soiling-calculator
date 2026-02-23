'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile, requireActiveSubscription } from '@/lib/auth'
import { plantSchema } from '@/features/plants/types/schemas'
import { track } from '@/lib/tracking'

export async function createPlant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Trial enforcement
  const trialError = await requireActiveSubscription(user.id)
  if (trialError) return { error: trialError }

  const raw = Object.fromEntries(formData)
  const parsed = plantSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Plant limit from profile (default: 1)
  const profile = await getProfile(user.id)
  const maxPlants = profile?.max_plants ?? 1

  const { count } = await supabase
    .from('plants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= maxPlants) {
    return { error: `Limite de instalaciones alcanzado (${maxPlants}). Contacta con nosotros para ampliar.` }
  }

  const { data, error } = await supabase
    .from('plants')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  track({ event: 'PLANT_CREATED', userId: user.id, metadata: { plantId: data.id } })

  revalidatePath('/plants')
  return { data: { id: data.id } }
}

export async function updatePlant(plantId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const raw = Object.fromEntries(formData)
  const parsed = plantSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // RLS garantiza que solo el dueño puede actualizar
  const { error } = await supabase
    .from('plants')
    .update(parsed.data)
    .eq('id', plantId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/plants')
  revalidatePath(`/plants/${plantId}`)
  return { success: true }
}

export async function deletePlant(plantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('plants')
    .delete()
    .eq('id', plantId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/plants')
  redirect('/plants')
}

export async function getPlants() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'No autorizado' }

  const { data, error } = await supabase
    .from('plants')
    .select(`
      *,
      production_readings (
        reading_date,
        soiling_percent,
        cleaning_recommendation,
        pr_current,
        cumulative_loss_eur
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .order('reading_date', { ascending: false, referencedTable: 'production_readings' })
    .limit(1, { referencedTable: 'production_readings' })

  if (error) return { data: [], error: error.message }

  const mapped = (data ?? []).map(({ production_readings, ...rest }) => ({
    ...rest,
    latest_reading: production_readings?.[0] ?? null,
  }))

  return { data: mapped, error: null }
}

export async function getPlantById(plantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'No autorizado' }

  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}
