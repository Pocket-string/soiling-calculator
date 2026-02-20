import Link from 'next/link'

export function LandingHero() {
  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-7">
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-1.5 text-sm text-primary-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          Founding 10 — Plazas limitadas
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight tracking-tight">
          Tu instalación solar,
          <br />
          <span className="text-primary-400">en su máximo rendimiento</span>
        </h1>

        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
          Calcula el soiling, el Performance Ratio y cuándo limpiar tus paneles con datos de irradiancia reales. Decisiones basadas en datos, no en estimaciones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/demo"
            className="w-full sm:w-auto px-8 py-4 rounded-lg border-2 border-border text-foreground-secondary font-semibold hover:border-border hover:bg-surface-alt transition-colors"
          >
            Ver demo en vivo →
          </Link>
          <Link
            href="/apply"
            className="w-full sm:w-auto px-8 py-4 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-lg"
          >
            Solicitar acceso gratuito
          </Link>
        </div>

        <p className="text-sm text-foreground-muted">
          30 días gratis · Sin tarjeta de crédito · Sin compromiso
        </p>
      </div>
    </section>
  )
}
