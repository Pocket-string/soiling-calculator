import type { Metadata } from 'next'
import { siteConfig } from '@/config/siteConfig'

export const metadata: Metadata = {
  title: siteConfig.seo.titleTemplate.replace('%s', 'Política de Privacidad'),
  description: `Política de privacidad de ${siteConfig.firmName}.`,
}

export default function PrivacidadPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-slate-800 to-slate-700 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Política de Privacidad</h1>
          <p className="text-slate-300 mt-2 text-base">
            Última actualización: {new Date(siteConfig.legal.privacyLastUpdated).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray max-w-none">
          <div className="space-y-8 text-foreground-secondary text-base leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Información que Recopilamos</h2>
              <p>
                En {siteConfig.firmName}, recopilamos información que usted nos proporciona al crear su cuenta y utilizar nuestra plataforma. Esta información puede incluir:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Nombre y dirección de correo electrónico (al registrarse)</li>
                <li>Datos técnicos de su instalación fotovoltaica (ubicación, potencia, orientación, parámetros de módulos)</li>
                <li>Lecturas de producción energética (kWh registrados por su inversor)</li>
                <li>Datos de uso de la plataforma (frecuencia de acceso, funciones utilizadas)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Uso de la Información</h2>
              <p>La información que recopilamos se utiliza para:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Calcular el soiling, Performance Ratio y pérdidas económicas de su instalación</li>
                <li>Obtener datos de irradiancia solar para las coordenadas de su planta vía la API Open-Meteo</li>
                <li>Generar recomendaciones de limpieza basadas en análisis coste-beneficio</li>
                <li>Cachear datos meteorológicos para mejorar la velocidad del servicio</li>
                <li>Comunicarnos con usted sobre su cuenta y actualizaciones del servicio</li>
                <li>Mejorar y desarrollar nuevas funcionalidades de la plataforma</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Protección de Datos</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal. Utilizamos Supabase como proveedor de infraestructura, que proporciona cifrado en tránsito (TLS) y en reposo, autenticación segura y políticas de seguridad a nivel de fila (RLS) en la base de datos para garantizar que cada usuario solo accede a sus propios datos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Datos Meteorológicos</h2>
              <p>
                Para calcular el soiling, obtenemos datos de irradiancia solar y temperatura de la API pública Open-Meteo. Estos datos son públicos y no contienen información personal. Las coordenadas geográficas de su planta se utilizan exclusivamente para obtener datos meteorológicos precisos y no se comparten con terceros.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Cookies y Tecnologías</h2>
              <p>
                Nuestro sitio web utiliza cookies de sesión necesarias para la autenticación y el funcionamiento de la plataforma. No utilizamos cookies de seguimiento publicitario ni de terceros con fines de marketing.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Sus Derechos</h2>
              <p>Usted tiene derecho a:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Acceder a su información personal y datos de planta almacenados</li>
                <li>Solicitar la corrección de datos inexactos</li>
                <li>Solicitar la eliminación de su cuenta y todos los datos asociados</li>
                <li>Exportar sus datos de producción y cálculos en formato CSV</li>
                <li>Oponerse al procesamiento de sus datos</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Contacto</h2>
              <p>
                Si tiene preguntas sobre esta política de privacidad o sobre cómo manejamos su información, puede contactarnos en:
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
