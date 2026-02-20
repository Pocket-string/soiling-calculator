import { LandingHero } from '@/features/marketing/components/LandingHero'
import { LandingFeatures } from '@/features/marketing/components/LandingFeatures'
import { LandingFAQ } from '@/features/marketing/components/LandingFAQ'
import Link from 'next/link'

export const metadata = {
  title: 'Soiling Calc — Monitorea la suciedad de tus paneles solares',
  description:
    'Calcula el soiling, el Performance Ratio y la recomendación de limpieza de tus paneles con datos de irradiancia reales.',
}

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingFeatures />
      <LandingFAQ />

      {/* CTA Final */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-primary-500 font-semibold text-sm uppercase tracking-wider">
            Founding 10
          </p>
          <h2 className="text-3xl font-bold">Quedan plazas disponibles</h2>
          <p className="text-slate-400 text-lg">
            Acceso gratuito completo durante 30 días para los primeros 10 instaladores que se
            unan al programa.
          </p>
          <Link
            href="/apply"
            className="inline-block mt-2 px-8 py-4 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors shadow-lg"
          >
            Solicitar mi plaza gratuita →
          </Link>
        </div>
      </section>
    </>
  )
}
