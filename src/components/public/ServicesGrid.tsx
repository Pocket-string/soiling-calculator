import Link from 'next/link'
import { siteConfig } from '@/config/siteConfig'
import { SectionHeading } from './SectionHeading'
import { ServiceIcon, ChevronRightIcon } from './icons'

export function ServicesGrid() {
  return (
    <section className="py-20 lg:py-28 bg-surface-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="No tienes que hacerlo solo"
          title="Herramientas profesionales para el monitoreo de tus paneles solares."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
          {siteConfig.services.map((service) => (
            <Link
              key={service.slug}
              href={`/servicios#${service.slug}`}
              className="group bg-surface rounded-lg p-8 shadow-card hover:shadow-elevated transition-all duration-300 border border-border-light hover:border-primary-200"
            >
              <div className="w-12 h-12 bg-primary-50 group-hover:bg-primary-100 rounded-lg flex items-center justify-center mb-5 transition-colors">
                <ServiceIcon icon={service.icon} className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-heading text-display-xs text-foreground mb-3">{service.title}</h3>
              <p className="text-body-sm text-foreground-secondary leading-relaxed mb-4">
                {service.shortDescription}
              </p>
              <span className="inline-flex items-center text-body-sm font-semibold text-primary-600 group-hover:text-primary-700 transition-colors">
                Más información
                <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
