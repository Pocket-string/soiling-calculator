import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not write code between createServerClient
  // and supabase.auth.getUser() as it can cause session issues
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protect /plants/* — requires any authenticated session
  if (path.startsWith('/plants') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect /admin/* — requires session + ADMIN_EMAIL match
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.redirect(new URL('/plants', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
