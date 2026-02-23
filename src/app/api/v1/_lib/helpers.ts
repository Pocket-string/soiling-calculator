import { NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/auth'
import { requireActiveSubscription } from '@/lib/auth'
import { createRateLimiter } from '@/lib/rate-limit'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// 100 req/min per API key prefix
const checkApiLimit = createRateLimiter(100, 60 * 1000)

export function apiResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data, error: null }, { status, headers: CORS_HEADERS })
}

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ data: null, error: message }, { status, headers: CORS_HEADERS })
}

export function handleCors(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

interface ApiAuthSuccess {
  userId: string
}

/**
 * Combined middleware: API key auth + rate limit + scope check + subscription check.
 * Returns { userId } on success, or a NextResponse error to short-circuit the handler.
 */
export async function withApiAuth(
  request: Request,
  requiredScope: string,
): Promise<ApiAuthSuccess | NextResponse> {
  // 1. Authenticate via API key (Bearer sk_live_...)
  const auth = await authenticateApiKey(request)
  if (!auth) return apiError('Invalid or missing API key', 401)

  // 2. Rate limit by key prefix (chars 7–22 of Authorization header, after "Bearer ")
  const keyPrefix = request.headers.get('authorization')?.slice(7, 22) ?? 'unknown'
  if (!checkApiLimit(keyPrefix)) return apiError('Rate limit exceeded', 429)

  // 3. Scope check
  if (!auth.scopes.includes(requiredScope)) {
    return apiError(`Missing required scope: ${requiredScope}`, 403)
  }

  // 4. Subscription check (admin and paid users pass; expired trials are rejected)
  const subError = await requireActiveSubscription(auth.userId)
  if (subError) return apiError(subError, 403)

  return { userId: auth.userId }
}
