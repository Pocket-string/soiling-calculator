import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlantById } from '@/actions/plants'
import { getReadings } from '@/actions/readings'
import { ReadingList } from '@/features/readings/components'
import { CleaningRecommendationCard } from '@/features/soiling/components'
import { ChartsSection } from '@/features/soiling/components/ChartsSection'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import type { ProductionReading } from '@/features/readings/types'
import type { Plant } from '@/features/plants/types'
import { getCurrencySymbol } from '@/lib/currency'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: plant } = await getPlantById(id)
  return { title: `${plant?.name ?? 'Planta'} | Soiling Calculator` }
}

export default async function PlantDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: plant, error }, { data: readings }] = await Promise.all([
    getPlantById(id),
    getReadings(id, 180),
  ])

  if (!plant || error) notFound()

  const typedPlant = plant as Plant
  const typedReadings = readings as ProductionReading[]
  const latestReading = typedReadings.length > 0 ? typedReadings[0] : null
  const currencySymbol = getCurrencySymbol(typedPlant.currency)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link href="/plants" className="text-sm text-blue-600 hover:underline">
            ← Mis plantas
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-2">{typedPlant.name}</h1>
          <p className="text-foreground-secondary text-sm mt-0.5">
            {typedPlant.total_power_kw?.toFixed(1)} kWp
            &nbsp;·&nbsp;
            {typedPlant.num_modules} módulos
            &nbsp;·&nbsp;
            {typedPlant.latitude.toFixed(3)}, {typedPlant.longitude.toFixed(3)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/plants/${id}/settings`}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-alt transition-colors"
          >
            ⚙️ Configuración
          </Link>
          <Link
            href={`/plants/${id}/readings/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            + Registrar lectura
          </Link>
        </div>
      </div>

      {/* RECOMENDACIÓN DE LIMPIEZA */}
      <CleaningRecommendationCard reading={latestReading} plant={typedPlant} />

      {/* GRÁFICOS — Client Component con dynamic imports para recharts */}
      <ChartsSection
        readings={typedReadings}
        cumulativeLossEur={latestReading?.cumulative_loss_eur ?? null}
        energyPriceEur={typedPlant.energy_price_eur}
        currencySymbol={currencySymbol}
      />

      {/* HISTORIAL DE LECTURAS */}
      <Card padding="none">
        <div className="flex items-center justify-between p-5 pb-0 mb-4">
          <h3 className="font-semibold text-foreground">
            Historial de lecturas
            {typedReadings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-foreground-muted">
                ({typedReadings.length})
              </span>
            )}
          </h3>
          {typedReadings.length > 0 && (
            <a
              href={`/api/plants/${id}/export`}
              className="text-sm text-blue-600 hover:underline"
            >
              ↓ Exportar CSV
            </a>
          )}
        </div>
        <div className="px-5 pb-5">
          <ReadingList readings={typedReadings} plantId={id} currencySymbol={currencySymbol} />
        </div>
      </Card>
    </div>
  )
}
