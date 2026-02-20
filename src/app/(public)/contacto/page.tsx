import type { Metadata } from 'next'
import { siteConfig } from '@/config/siteConfig'
import { SectionHeading } from '@/components/public/SectionHeading'
import { ContactForm } from '@/components/public/ContactForm'
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon, WhatsAppIcon } from '@/components/public/icons'

export const metadata: Metadata = {
  title: siteConfig.seo.titleTemplate.replace('%s', 'Contacto'),
  description: `Contáctenos para una consulta gratuita. ${siteConfig.firmName} - ${siteConfig.contact.address}, ${siteConfig.contact.city}. Tel: ${siteConfig.contact.phoneDisplay}`,
}

export default function ContactoPage() {
  const { contact } = siteConfig

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-700 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Contáctenos"
            title="Estamos Aquí para Ayudarle"
            subtitle="¿Tiene alguna pregunta o desea programar una cita? Envíenos un mensaje o llámenos directamente."
            light
          />
        </div>
      </section>

      {/* Contact form + Map */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Map + Info */}
            <div>
              <div className="rounded-lg overflow-hidden shadow-elevated h-[350px] mb-8">
                <iframe
                  src={contact.googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Ubicación de ${siteConfig.firmName}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-surface-alt rounded-lg">
                  <MapPinIcon className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-body-sm">Dirección</p>
                    <p className="text-body-xs text-foreground-secondary">{contact.address}, {contact.city}, {contact.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface-alt rounded-lg">
                  <PhoneIcon className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-body-sm">Teléfono</p>
                    <a href={`tel:${contact.phone}`} className="text-body-xs text-primary-600 hover:underline">{contact.phoneDisplay}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface-alt rounded-lg">
                  <MailIcon className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-body-sm">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-body-xs text-primary-600 hover:underline">{contact.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface-alt rounded-lg">
                  <ClockIcon className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-body-sm">Horario</p>
                    <p className="text-body-xs text-foreground-secondary">{contact.officeHours}</p>
                  </div>
                </div>
              </div>

              {contact.whatsappNumber && (
                <a
                  href={`https://wa.me/${contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-lg transition-colors"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Escribir por WhatsApp
                </a>
              )}
            </div>

            {/* Form */}
            <div>
              <h2 className="font-heading text-display-xs text-foreground mb-2">Envíenos un Mensaje</h2>
              <p className="text-body-md text-foreground-secondary mb-8">
                Complete el formulario y nos pondremos en contacto a la brevedad.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
