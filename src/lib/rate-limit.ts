/**
 * In-memory rate limiter (per-instance).
 * For production distributed rate limiting, replace with Redis or DB-backed solution.
 */
export function createRateLimiter(max: number, windowMs: number) {
  const map = new Map<string, { count: number; resetAt: number }>()

  return function check(key: string): boolean {
    const now = Date.now()
    const entry = map.get(key)

    if (!entry || now > entry.resetAt) {
      map.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }

    if (entry.count >= max) return false

    entry.count++
    return true
  }
}
