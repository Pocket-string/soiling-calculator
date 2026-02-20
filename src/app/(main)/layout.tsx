import { MainShell } from '@/components/layout/MainShell'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let trialExpired = false
  let trialDaysLeft: number | null = null

  if (user) {
    const profile = await getProfile(user.id)

    // Admin: profile-based OR email fallback (bootstrapping)
    isAdmin = profile?.access_level === 'admin'
      || (!!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL)

    // Trial: only check for non-admin, non-paid users
    if (profile && profile.access_level !== 'admin' && profile.access_level !== 'paid') {
      if (profile.trial_ends_at) {
        const days = Math.ceil(
          (new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
        trialDaysLeft = Math.max(days, 0)
        if (days <= 0) trialExpired = true
      }
    }
  }

  return (
    <MainShell isAdmin={isAdmin} trialDaysLeft={trialDaysLeft} trialExpired={trialExpired}>
      {children}
    </MainShell>
  )
}
