import { type NextRequest, NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
  }

  // Recovery tokens → password reset page (existing flow)
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/update-password`)
  }

  // All other types (signup, email, email_change) → branded success page
  return NextResponse.redirect(`${origin}/email-confirmed`)
}
