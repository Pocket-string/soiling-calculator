import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/email-confirmed',
  '/servicios',
  '/equipo',
  '/contacto',
  '/demo',
  '/apply',
  '/waitlist',
  '/thanks',
  '/privacidad',
  '/terminos',
])

const PUBLIC_PREFIXES = ['/invite/', '/auth/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes (exact match or prefix match)
  if (PUBLIC_ROUTES.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // Check auth for protected routes
  const { user, supabaseResponse } = await updateSession(request)

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
