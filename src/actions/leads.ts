'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import type { Lead, LeadStatus } from '@/features/leads/types'

export async function getLeads(): Promise<{ data: Lead[]; error: string | null }> {
  await requireAdmin()

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as Lead[], error: null }
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<{ error: string | null }> {
  await requireAdmin()

  // Transiciones a 'invited' o 'active' solo via createInvite()
  if (status === 'invited' || status === 'active') {
    return { error: 'Usa el boton "Invitar" para activar un lead.' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)

  if (error) return { error: error.message }

  revalidatePath('/admin/leads')
  return { error: null }
}

export async function updateLeadNotes(
  leadId: string,
  notes: string,
): Promise<{ error: string | null }> {
  await requireAdmin()

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('leads')
    .update({ notes: notes.trim() || null })
    .eq('id', leadId)

  if (error) return { error: error.message }

  revalidatePath('/admin/leads')
  return { error: null }
}
