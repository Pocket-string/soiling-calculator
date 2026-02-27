import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      userError: userError?.message ?? null,
    })
  }

  // Get profile via service client (same as getProfile)
  const service = createServiceClient()
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const isAdminByProfile = profile?.access_level === 'admin'
  const isAdminByEmail = !!(serverEnv.ADMIN_EMAIL && user.email === serverEnv.ADMIN_EMAIL)

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
    adminEmail: serverEnv.ADMIN_EMAIL ?? '(not set)',
    profileFound: !!profile,
    profileError: profileError?.message ?? null,
    accessLevel: profile?.access_level ?? null,
    isAdminByProfile,
    isAdminByEmail,
    isAdmin: isAdminByProfile || isAdminByEmail,
  })
}
