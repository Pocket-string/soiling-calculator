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
      </div>
    </section>
  )
}
