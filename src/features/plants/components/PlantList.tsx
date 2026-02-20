import { PlantCard } from './PlantCard'
import type { PlantWithStats } from '@/features/plants/types'
import Link from 'next/link'

interface Props {
  plants: PlantWithStats[]
}

const STEPS = [
  {
    num: 1,
    title: 'Registra tu planta',
    desc: 'Configura potencia, ubicación y parámetros técnicos de tu instalación.',
  },
  {
    num: 2,
    title: 'Agrega una lectura',
    desc: 'Introduce la producción real (kWh) y la app obtiene la irradiancia automáticamente.',
  },
  {
    num: 3,
    title: 'Analiza el soiling',
    desc: 'Visualiza el Performance Ratio, el soiling acumulado y la recomendación de limpieza.',
  },
]

export function PlantList({ plants }: Props) {
  if (plants.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-lg bg-primary-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">
            Comienza a monitorear tu instalación
          </h3>
          <p className="text-foreground-secondary text-sm mb-8">
            En 3 pasos tendrás tu análisis de soiling listo. El proceso toma ~2 minutos.
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-8 text-left">
            {STEPS.map((step) => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {step.num}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-foreground-secondary mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/plants/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors shadow-sm"
          >
            Crear mi primera planta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plants.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </div>
  )
}
