import type { Metadata } from 'next'
import { siteConfig } from '@/config/siteConfig'

export const metadata: Metadata = {
  title: siteConfig.seo.titleTemplate.replace('%s', 'Términos de Servicio'),
  description: `Términos de servicio de ${siteConfig.firmName}.`,
}

export default function TerminosPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-slate-800 to-slate-700 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Términos de Servicio</h1>
          <p className="text-slate-300 mt-2 text-base">
            Última actualización: {new Date(siteConfig.legal.termsLastUpdated).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 text-foreground-secondary text-base leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar la plataforma {siteConfig.firmName}, usted acepta estar sujeto a estos términos de servicio. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Descripción del Servicio</h2>
              <p>
                {siteConfig.firmName} es una plataforma de software como servicio (SaaS) que permite a los usuarios monitorear el soiling de sus instalaciones fotovoltaicas. El servicio incluye cálculo de Performance Ratio, estimación de pérdidas por suciedad, y recomendaciones de limpieza basadas en datos de irradiancia solar. Los cálculos son informativos y no sustituyen una inspección profesional de la instalación.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Cuentas de Usuario</h2>
              <p>
                El acceso a {siteConfig.firmName} requiere una cuenta de usuario. Las cuentas se crean por invitación del administrador. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas bajo su cuenta. Debe cambiar su contraseña temporal tras el primer inicio de sesión.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Período de Prueba</h2>
              <p>
                Las nuevas cuentas incluyen un período de prueba gratuito de 30 días con acceso completo a las funcionalidades de la plataforma. Durante el período de prueba, el plan gratuito permite registrar una instalación fotovoltaica. Al finalizar el período de prueba, las funciones de creación quedarán deshabilitadas hasta que se active una suscripción.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Propiedad Intelectual</h2>
              <p>
                Todo el contenido de esta plataforma, incluyendo el software, algoritmos de cálculo, interfaz de usuario, textos y gráficos, es propiedad de {siteConfig.firmName} y está protegido por las leyes de propiedad intelectual. Los datos de producción y configuración de plantas introducidos por el usuario son propiedad del usuario.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Limitación de Responsabilidad</h2>
              <p>
                {siteConfig.firmName} proporciona cálculos basados en modelos físicos y datos meteorológicos de terceros (Open-Meteo). Estos cálculos son estimaciones y pueden diferir de los valores reales. {siteConfig.firmName} no será responsable de decisiones tomadas basándose en los resultados de la plataforma. Los usuarios deben complementar la información con inspecciones profesionales cuando sea necesario.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Ley Aplicable</h2>
              <p>
                Estos términos se rigen por las leyes de {siteConfig.contact.country}. Cualquier disputa será resuelta ante los tribunales competentes de {siteConfig.contact.city}.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">8. Modificaciones</h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en esta plataforma. Se notificará a los usuarios registrados por correo electrónico cuando se realicen cambios significativos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">9. Contacto</h2>
              <p>
                Para preguntas sobre estos términos de servicio, contáctenos en:
              </p>
              <p className="mt-3">
                <strong>{siteConfig.firmName}</strong><br />
                Email: <a href={`mailto:${siteConfig.contact.email}`} className="text-blue-600 hover:underline">{siteConfig.contact.email}</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
