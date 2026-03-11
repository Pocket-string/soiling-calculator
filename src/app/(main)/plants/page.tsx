import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkTrialStatus } from '@/lib/auth'
import { getPlants } from '@/actions/plants'
import { getOnboardingStatus } from '@/actions/onboarding'
import { getOnboardingQuestions } from '@/features/intelligence/services/activationConcierge'
import { PlantList } from '@/features/plants/components'
import { EmptyPlantState } from '@/features/plants/components/EmptyPlantState'
import { OnboardingBanner } from '@/features/intelligence/components/OnboardingBanner'
import { ActivationProgress } from '@/features/intelligence/components/ActivationProgress'
import { track, EVENTS } from '@/lib/tracking'
import Link from 'next/link'

export const metadata = { title: 'Mis Plantas | Soiling Calculator' }

export default async function PlantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: plants }, { expired: trialExpired }, onboarding] = await Promise.all([
    getPlants(),
    checkTrialStatus(),
    getOnboardingStatus(user.id),
  ])

  const svc = createServiceClient()

  // Track login (dedup: once per day per user, fire-and-forget)
  const today = new Date().toISOString().slice(0, 10)
  svc
    .from('funnel_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_name', EVENTS.USER_LOGIN)
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00Z`)
    .then(({ count }) => {
      if ((count ?? 0) === 0) {
        track({ event: EVENTS.USER_LOGIN, userId: user.id })
      }
    })

  // Get lead data for personalization (match by email)
  let leadData: { systemKwp: number | null; inverterBrand: string | null } | null = null
  if (plants.length === 0 && user.email) {
    const { data: lead } = await svc
      .from('leads')
      .select('system_kwp, inverter_brand')
      .eq('email', user.email)
      .maybeSingle()

    if (lead) {
      leadData = {
        systemKwp: lead.system_kwp ? Number(lead.system_kwp) : null,
        inverterBrand: lead.inverter_brand,
      }
    }
  }

  // Count total readings for activation progress
  const { count: readingsCount } = await svc
    .from('production_readings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  const totalReadings = readingsCount ?? 0

  // Show onboarding only AFTER user has created a plant (better timing)
  const showOnboarding = !onboarding?.completed_at && plants.length > 0
  const questions = showOnboarding ? getOnboardingQuestions() : []
  const initialStep = showOnboarding && onboarding
    ? questions.findIndex((q) => !onboarding[q.key])
    : 0

  // Empty state: no plants
  if (plants.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyPlantState
          systemKwp={leadData?.systemKwp}
          inverterBrand={leadData?.inverterBrand}
          trialExpired={trialExpired}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Activation progress (disappears when fully activated) */}
      <ActivationProgress
        onboardingCompleted={!!onboarding?.completed_at}
        plantCount={plants.length}
        readingCount={totalReadings}
      />

      {/* Onboarding (only after plant creation) */}
      {showOnboarding && questions.length > 0 && (
        <OnboardingBanner
          questions={questions}
          initialStep={initialStep >= 0 ? initialStep : 0}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Plantas</h1>
          <p className="text-foreground-secondary text-sm mt-1">
            {plants.length} instalacion{plants.length !== 1 ? 'es' : ''} fotovoltaica{plants.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!trialExpired ? (
          <Link
            href="/plants/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            + Nueva planta
          </Link>
        ) : (
          <span className="text-xs font-medium text-error-600 bg-error-50 px-3 py-1.5 rounded-lg border border-error-100">
            Trial expirado
          </span>
        )}
      </div>

      <PlantList plants={plants} />
    </div>
  )
}
