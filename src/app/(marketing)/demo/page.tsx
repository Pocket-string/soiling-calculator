import Link from 'next/link'
import { demoPlant, demoReadings } from '@/lib/demoData'
import { DemoKPIs } from '@/features/demo/components/DemoKPIs'
import { DemoReadingTable } from '@/features/demo/components/DemoReadingTable'
import { ChartsSection } from '@/features/soiling/components/ChartsSection'
import { DemoLocationMap } from '@/features/demo/components/DemoLocationMap'
import { getCurrencySymbol } from '@/lib/currency'

export const metadata = {
  title: 'Demo — Soiling Calc',
  description:
    'Explora un caso real de instalacion solar domiciliaria con datos de Santiago de Chile. Ve como Soiling Calc calcula el soiling y recomienda cuando limpiar.',
}

export default function DemoPage() {
  const latestReading = demoReadings[demoReadings.length - 1]
  const cumulativeLoss = latestReading?.cumulative_loss_eur ?? null
  const currencySymbol = getCurrencySymbol(demoPlant.currency)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Banner demo */}
      <div className="rounded-lg bg-primary-50 border border-primary-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-primary-800 text-sm">
            Vista de demostracion — datos reales de una instalacion solar domiciliaria en Santiago de Chile
          </p>
          <p className="text-primary-600 text-xs mt-0.5">
            4.55 kWp · 7 modulos · 36 lecturas · Solo lectura
          </p>
        </div>
        <Link
          href="/apply"
          className="flex-shrink-0 px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          Quiero acceso gratuito →
        </Link>
      </div>

      {/* KPIs */}
      <DemoKPIs reading={latestReading} plant={demoPlant} />

      {/* Ubicacion */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Ubicacion de la instalacion</h2>
        <DemoLocationMap
          latitude={demoPlant.latitude}
          longitude={demoPlant.longitude}
          plantName={demoPlant.name}
          powerKw={demoPlant.total_power_kw}
        />
      </section>

      {/* Gráficos */}
      <ChartsSection
        readings={demoReadings}
        cumulativeLossEur={cumulativeLoss}
        energyPriceEur={demoPlant.energy_price_eur}
        currencySymbol={currencySymbol}
      />

      {/* Tabla de lecturas */}
      <DemoReadingTable readings={demoReadings} />

      {/* CTA inferior */}
      <div className="rounded-lg bg-slate-900 text-white p-8 text-center space-y-4">
        <h3 className="text-xl font-bold">¿Tu instalación tiene soiling acumulado?</h3>
        <p className="text-slate-400">
          Registra tus propias lecturas y descubre exactamente cuánto dinero estás perdiendo y
          cuándo te conviene limpiar.
        </p>
        <Link
          href="/apply"
          className="inline-block px-6 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          Solicitar acceso gratuito (30 días)
        </Link>
      </div>
    </div>
  )
}
