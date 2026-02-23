import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { withApiAuth, apiResponse, apiError, handleCors } from '../../_lib/helpers'

export async function OPTIONS(): Promise<Response> {
  return handleCors()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await withApiAuth(request, 'plants:read')
  if (auth instanceof Response) return auth

  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .single()

  if (error || !data) return apiError('Plant not found', 404)

  return apiResponse(data)
}
