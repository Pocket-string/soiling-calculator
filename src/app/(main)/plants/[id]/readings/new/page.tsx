import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkTrialStatus } from '@/lib/auth'
import { siteConfig } from '@/config/siteConfig'
import { getPlantById } from '@/actions/plants'
import { ReadingForm } from '@/features/readings/components'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: plant } = await getPlantById(id)
  return { title: `Nueva lectura — ${plant?.name ?? 'Planta'} | Soiling Calculator` }
}

export default async function NewReadingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: plant, error } = await getPlantById(id)
  if (!plant || error) notFound()

  // Trial expirado → bloquear creación
  const { expired } = await checkTrialStatus()
  if (expired) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <Link href={`/plants/${id}`} className="text-sm text-blue-600 hover:underline">
            ← Volver a {plant.name}
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Período de prueba expirado</CardTitle>
            <CardDescription>
              No puedes registrar nuevas lecturas con el período de prueba expirado.
              Contacta con nosotros para activar tu suscripción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              Contactar para suscribirme
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href={`/plants/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Volver a {plant.name}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar lectura de producción</CardTitle>
          <CardDescription>
            Ingresa los kWh medidos por tu inversor. El sistema calculará automáticamente
            el soiling, pérdidas económicas y recomendación de limpieza.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Info de la planta */}
          <div className="mb-6 rounded-lg bg-surface-alt border border-border p-3 text-sm text-foreground-secondary">
            <span className="font-medium">{plant.name}</span>
            {' · '}
            {plant.total_power_kw?.toFixed(1)} kWp
            {' · '}
            {plant.num_modules} módulos
            {' · '}
            <span className="text-foreground-muted">
              {plant.latitude.toFixed(3)}, {plant.longitude.toFixed(3)}
            </span>
          </div>
          <ReadingForm plantId={id} plantName={plant.name} />
        </CardContent>
      </Card>
    </div>
  )
}
