import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkTrialStatus } from '@/lib/auth'
import { getPlants } from '@/actions/plants'
import { PlantList } from '@/features/plants/components'
import Link from 'next/link'

export const metadata = { title: 'Mis Plantas | Soiling Calculator' }

export default async function PlantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: plants } = await getPlants()
  const { expired: trialExpired } = await checkTrialStatus()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Plantas</h1>
          <p className="text-foreground-secondary text-sm mt-1">
            {plants.length === 0
              ? 'Sin instalaciones registradas'
              : `${plants.length} instalación${plants.length !== 1 ? 'es' : ''} fotovoltaica${plants.length !== 1 ? 's' : ''}`}
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
