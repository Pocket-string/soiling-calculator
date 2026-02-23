import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { withApiAuth, apiResponse, apiError, handleCors } from '../_lib/helpers'

export async function OPTIONS(): Promise<Response> {
  return handleCors()
}

export async function GET(request: NextRequest): Promise<Response> {
  const auth = await withApiAuth(request, 'plants:read')
  if (auth instanceof Response) return auth

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) return apiError(error.message, 500)

  return apiResponse(data)
}
