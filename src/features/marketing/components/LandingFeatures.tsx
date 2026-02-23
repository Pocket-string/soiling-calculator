const features = [
  {
    icon: '☀️',
    title: 'Irradiancia real según tu ubicación',
    description:
      'Datos meteorológicos reales de tu zona, no estimaciones genéricas. Cada cálculo usa la irradiancia del día exacto que registras, obtenida automáticamente por API.',
  },
  {
    icon: '🌡️',
    title: 'Corrección por temperatura del módulo',
    description:
      'Corrección de rendimiento por temperatura real del módulo fotovoltaico. Elimina el ruido térmico para medir el soiling con precisión, sin confundir calor con suciedad.',
  },
  {
    icon: '💰',
    title: 'Recomendación basada en coste-beneficio',
    description:
      'Te decimos exactamente cuándo limpiar: cuando las pérdidas acumuladas superan el coste de limpieza. Sin gastar de más ni de menos.',
  },
]

const PROVIDERS = ['SolarEdge', 'Huawei FusionSolar']

export function LandingFeatures() {
  return (
    <section className="py-20 px-6 bg-surface-alt">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground">
            Calculadora de soiling de precisión
          </h2>
          <p className="mt-3 text-lg text-foreground-secondary">
            Metodología técnica en una interfaz sencilla.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ icon, title, description }) => (
            <div
              key={title}
              className="bg-surface rounded-lg border border-border-light p-8 space-y-4 shadow-sm"
            >
              <div className="text-4xl">{icon}</div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-foreground-secondary text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Integration highlight */}
        <div className="mt-8 bg-surface rounded-lg border border-primary-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-xl">
                  <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  Conecta tu inversor, olvida el registro manual
                </h3>
              </div>
              <p className="text-foreground-secondary text-sm leading-relaxed">
                Integra tu inversor SolarEdge o Huawei FusionSolar en 2 minutos. La app sincroniza tus lecturas de produccion automaticamente cada dia — sin copiar datos a mano, sin errores de transcripcion.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground"
                >
                  <span className="h-2 w-2 rounded-full bg-success-500" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
