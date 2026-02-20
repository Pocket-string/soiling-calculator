import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkTrialStatus, getProfile } from '@/lib/auth'
import { siteConfig } from '@/config/siteConfig'
import { PlantForm } from '@/features/plants/components'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = { title: 'Nueva Planta | Soiling Calculator' }

export default async function NewPlantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Trial expirado → bloquear creación
  const { expired } = await checkTrialStatus()
  if (expired) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/plants" className="text-sm text-blue-600 hover:underline">
            &larr; Volver a plantas
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Período de prueba expirado</CardTitle>
            <CardDescription>
              Tu período de prueba ha finalizado. Para seguir creando instalaciones,
              contacta con nosotros para activar tu suscripción.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                Contactar para suscribirme
              </a>
              <Link
                href="/plants"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground-secondary text-sm hover:bg-surface-alt transition-colors"
              >
                Ver mis plantas
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Plant limit from profile
  const profile = await getProfile(user.id)
  const maxPlants = profile?.max_plants ?? 1

  const { count } = await supabase
    .from('plants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= maxPlants) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/plants" className="text-sm text-blue-600 hover:underline">
            &larr; Volver a plantas
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Límite de instalaciones alcanzado</CardTitle>
            <CardDescription>
              Tu plan incluye {maxPlants} instalación{maxPlants > 1 ? 'es' : ''} fotovoltaica{maxPlants > 1 ? 's' : ''}. Ya tienes {count} registrada{(count ?? 0) > 1 ? 's' : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground-secondary">
              Para monitorear más instalaciones, contacta con nosotros y ampliaremos tu plan.
            </p>
            <div className="flex gap-3">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                Contactar para ampliar
              </a>
              <Link
                href="/plants"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground-secondary text-sm hover:bg-surface-alt transition-colors"
              >
                Ver mis plantas
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/plants" className="text-sm text-blue-600 hover:underline">
          &larr; Volver a plantas
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nueva instalación fotovoltaica</CardTitle>
          <CardDescription>
            Configura los parámetros técnicos y económicos de tu planta para calcular el soiling con precisión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlantForm />
        </CardContent>
      </Card>
    </div>
  )
}
