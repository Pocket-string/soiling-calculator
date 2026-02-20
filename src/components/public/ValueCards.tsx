import { siteConfig } from '@/config/siteConfig'
import { ValueIcon } from './icons'

export function ValueCards() {
  return (
    <section className="relative -mt-12 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {siteConfig.values.map((value, index) => (
            <div
              key={index}
              className="bg-surface rounded-lg shadow-elevated p-8 flex items-start gap-4 hover:shadow-modal transition-shadow duration-300 border border-border-light"
            >
              <div className="shrink-0 w-14 h-14 bg-primary-50 rounded-lg flex items-center justify-center">
                <ValueIcon icon={value.icon} className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <p className="text-body-xs text-primary-600 font-semibold uppercase tracking-wider mb-1">
                  {value.icon === 'quality' ? 'Tecnologia avanzada' : value.icon === 'results' ? 'Datos accionables' : 'Cero hardware extra'}
                </p>
                <h3 className="font-heading text-display-xs text-foreground mb-2">{value.title}</h3>
                <p className="text-body-sm text-foreground-secondary leading-relaxed">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
