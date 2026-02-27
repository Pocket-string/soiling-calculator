import { createClient, createServiceClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function AdminDebugPage() {
  const steps: { step: string; result: string; ok: boolean }[] = []

  // Step 1: Create client (same as requireAuth)
  let userId: string | null = null
  let userEmail: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      steps.push({ step: 'createClient + getUser', result: `Error: ${error.message}`, ok: false })
    } else if (!user) {
      steps.push({ step: 'createClient + getUser', result: 'No user (would redirect to /login)', ok: false })
    } else {
      userId = user.id
      userEmail = user.email ?? null
      steps.push({ step: 'createClient + getUser', result: `OK: ${user.email} (${user.id})`, ok: true })
    }
  } catch (e) {
    steps.push({ step: 'createClient + getUser', result: `Exception: ${String(e)}`, ok: false })
  }

  // Step 2: Get profile via service client (same as getProfile)
  let accessLevel: string | null = null
  if (userId) {
    try {
      const service = createServiceClient()
      const { data, error } = await service
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        steps.push({ step: 'getProfile (service client)', result: `Error: ${error.message}`, ok: false })
      } else if (!data) {
        steps.push({ step: 'getProfile (service client)', result: 'No profile found', ok: false })
      } else {
        accessLevel = data.access_level
        steps.push({ step: 'getProfile (service client)', result: `OK: access_level=${data.access_level}`, ok: true })
      }
    } catch (e) {
      steps.push({ step: 'getProfile (service client)', result: `Exception: ${String(e)}`, ok: false })
    }
  }

  // Step 3: Admin check
  const isAdminByProfile = accessLevel === 'admin'
  const isAdminByEmail = !!(serverEnv.ADMIN_EMAIL && userEmail === serverEnv.ADMIN_EMAIL)
  steps.push({
    step: 'Admin check',
    result: `byProfile=${isAdminByProfile}, byEmail=${isAdminByEmail} (ADMIN_EMAIL=${serverEnv.ADMIN_EMAIL ?? 'not set'})`,
    ok: isAdminByProfile || isAdminByEmail,
  })

  const wouldRedirect = !isAdminByProfile && !isAdminByEmail

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Admin Debug (Server Component)</h1>
      <p className="text-sm text-foreground-muted">
        This page runs the same checks as requireAdmin() but shows results instead of redirecting.
        It goes through the middleware, unlike API routes.
      </p>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className={`p-3 rounded border ${s.ok ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <p className="font-mono text-sm font-semibold">{s.step}</p>
            <p className="font-mono text-xs mt-1">{s.result}</p>
          </div>
        ))}
      </div>

      {wouldRedirect && (
        <div className="p-4 bg-red-100 border-2 border-red-600 rounded">
          <p className="font-bold text-red-800">requireAdmin() WOULD redirect to /plants</p>
        </div>
      )}
      {!wouldRedirect && (
        <div className="p-4 bg-green-100 border-2 border-green-600 rounded">
          <p className="font-bold text-green-800">requireAdmin() WOULD pass (user is admin)</p>
        </div>
      )}
    </div>
  )
}
