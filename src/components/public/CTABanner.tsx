import Link from 'next/link'
import { siteConfig } from '@/config/siteConfig'
import { PhoneIcon } from './icons'

export function CTABanner() {
  return (
    <section className="relative bg-gradient-to-r from-slate-800 to-slate-700 overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2l-5-5h2l5 5 5-5h2l-5 5v2h20v2H24v2.5l5 5h-2l-5-5-5 5h-2l5-5z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-heading text-display-sm md:text-display-md text-white mb-3">
              Optimiza el rendimiento de tu instalación fotovoltaica
            </h2>
            <p className="text-body-lg text-slate-300">
              Solicita acceso para monitorear el soiling de tus paneles solares.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="flex items-center gap-3 bg-surface text-foreground font-heading font-bold text-display-xs px-8 py-4 rounded-lg hover:bg-primary-50 transition-colors shadow-lg"
            >
              <PhoneIcon className="w-6 h-6" />
              {siteConfig.contact.phoneDisplay}
            </a>
            <Link
              href="/contacto"
              className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold px-8 py-4 rounded-lg transition-colors shadow-lg uppercase tracking-wider text-body-sm"
            >
              Solicitar Acceso
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
