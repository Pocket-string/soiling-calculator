export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Panel izquierdo - Branding solar */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary-500 flex items-center justify-center shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white leading-tight">Soiling Calc</p>
                <p className="text-xs text-slate-400 leading-tight">Calculadora Solar</p>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Monitorea la suciedad de tus paneles solares
            </h1>
            <p className="text-base text-slate-400 leading-relaxed">
              Calcula el soiling, el Performance Ratio y la recomendación de limpieza de tus instalaciones fotovoltaicas con datos de irradiancia reales.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">Corrección por temperatura real del módulo fotovoltaico</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">Irradiancia real por API meteorológica según tu ubicación</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">Recomendación de limpieza con análisis coste-beneficio</span>
            </div>
          </div>
        </div>

        {/* Decoración */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-48 h-48 bg-white/3 rounded-full blur-3xl" />
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
