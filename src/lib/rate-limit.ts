/**
 * In-memory rate limiter (per-instance).
 *
 * Limitations of this implementation:
 * - State resets on every deploy/restart
 * - Not shared between multiple instances (horizontal scaling)
 * - No memory cleanup (entries accumulate until process restart)
 *
 * TODO: Redis migration plan (when needed — single-instance is fine for now)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Install ioredis: `pnpm add ioredis`
 * 2. Add REDIS_URL to .env.local and .env.example
 * 3. Replace Map with Redis INCR + EXPIRE:
 *    - Key format: `rl:{endpoint}:{ip}` (e.g. `rl:export:192.168.1.1`)
 *    - INCR key → if count === 1 → EXPIRE key windowMs/1000
 *    - If count > max → return false
 * 4. Alternative: use Supabase edge function rate limiting or
 *    Cloudflare Rate Limiting rules (no code change needed)
 * 5. Trigger: when deploying multiple instances or seeing rate limit
 *    bypass due to restarts
 */
export function createRateLimiter(max: number, windowMs: number) {
  const map = new Map<string, { count: number; resetAt: number }>()

  // Periodic cleanup to prevent memory leaks on long-running instances
  const CLEANUP_INTERVAL = 60_000 // 1 minute
  let lastCleanup = Date.now()

  return function check(key: string): boolean {
    const now = Date.now()

    // Lazy cleanup: purge expired entries periodically
    if (now - lastCleanup > CLEANUP_INTERVAL) {
      for (const [k, v] of map) {
        if (now > v.resetAt) map.delete(k)
      }
      lastCleanup = now
    }

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
