import Link from 'next/link'

interface Props {
  systemKwp?: number | null
  inverterBrand?: string | null
  trialExpired?: boolean
}

export function EmptyPlantState({ systemKwp, inverterBrand, trialExpired }: Props) {
  const hasLeadData = systemKwp || inverterBrand

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Solar panel icon */}
      <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Configura tu primera planta en 2 minutos
      </h2>

      {hasLeadData && (
        <p className="text-sm text-foreground-secondary mb-4">
          Tu sistema de{' '}
          {systemKwp && <span className="font-semibold text-foreground">{systemKwp} kWp</span>}
          {systemKwp && inverterBrand && ' con inversor '}
          {inverterBrand && <span className="font-semibold text-foreground">{inverterBrand}</span>}
          {' '}esta listo para configurar
        </p>
      )}

      {/* Steps */}
      <div className="flex items-center gap-2 sm:gap-3 mb-8 text-xs sm:text-sm text-foreground-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">1</span>
          <span>Datos basicos</span>
        </div>
        <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">2</span>
          <span>Ubicacion</span>
        </div>
        <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-success-100 text-success-700 flex items-center justify-center text-xs font-bold">3</span>
          <span>Listo</span>
        </div>
      </div>

      {!trialExpired ? (
        <Link
          href="/plants/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-8 py-3 text-base font-semibold text-white hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
        >
          Crear mi planta
        </Link>
      ) : (
        <p className="text-sm text-error-600 font-medium">
          Tu periodo de prueba ha expirado. Contactanos para continuar.
        </p>
      )}

      <p className="text-xs text-foreground-muted mt-4">
        Solo necesitas el kWp de tu sistema y su ubicacion
      </p>
    </div>
  )
}
