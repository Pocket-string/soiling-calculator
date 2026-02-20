import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlantById } from '@/actions/plants'
import { PlantForm, DeletePlantButton } from '@/features/plants/components'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { data: plant } = await getPlantById(id)
  return { title: `Configuración — ${plant?.name ?? 'Planta'} | Soiling Calc` }
}

export default async function PlantSettingsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: plant, error } = await getPlantById(id)
  if (!plant || error) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/plants/${id}`} className="text-sm text-blue-600 hover:underline">
          &larr; Volver a {plant.name}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configuración de planta</CardTitle>
          <CardDescription>
            Modifica los parámetros técnicos y económicos de {plant.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlantForm plant={plant} />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <div className="mt-8 rounded-lg border border-error-100 bg-error-50/50 p-5">
        <h3 className="font-semibold text-error-700 mb-1">Zona de peligro</h3>
        <p className="text-sm text-error-600 mb-4">
          Eliminar esta planta borrará permanentemente todas sus lecturas y datos asociados.
        </p>
        <DeletePlantButton plantId={id} plantName={plant.name} />
      </div>
    </div>
  )
}
