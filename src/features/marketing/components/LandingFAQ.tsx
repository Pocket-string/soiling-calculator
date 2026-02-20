'use client'

import { useState } from 'react'

const faqs = [
  {
    question: '¿Qué necesito para usar Soiling Calc?',
    answer:
      'Solo necesitas tu medidor de producción (kWh diarios o semanales), los parámetros técnicos básicos de tus paneles (potencia pico, área, coeficiente de temperatura) y tu ubicación GPS. La app obtiene la irradiancia meteorológica automáticamente.',
  },
  {
    question: '¿Con qué inversores funciona?',
    answer:
      'Con cualquier inversor que te permita ver la producción en kWh: Huawei SUN2000, SMA Sunny Boy, Fronius, SolarEdge, Growatt y la mayoría de marcas del mercado. Si puedes leer los kWh, puedes usar la app.',
  },
  {
    question: '¿Mis datos de producción son privados?',
    answer:
      'Sí. Tus datos de producción son privados y solo accesibles para ti. Usamos cifrado en tránsito y en reposo. No compartimos ni vendemos datos de producción de ningún usuario.',
  },
  {
    question: '¿Qué incluye el período de prueba gratuito?',
    answer:
      'Acceso completo durante 30 días: registro de lecturas, gráficos históricos de soiling y Performance Ratio, exportación CSV y recomendaciones de limpieza coste-beneficio. Al finalizar te contactamos para ver cómo continuar.',
  },
]

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground">Preguntas frecuentes</h2>
        </div>

        <div className="space-y-3">
          {faqs.map(({ question, answer }, i) => (
            <div
              key={question}
              className="rounded-lg border border-border bg-surface overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-surface-alt transition-colors"
              >
                <span className="font-medium text-foreground text-sm">{question}</span>
                <span
                  className={`text-foreground-muted transition-transform duration-200 flex-shrink-0 ${open === i ? 'rotate-180' : ''}`}
                >
                  ▼
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-foreground-secondary leading-relaxed border-t border-border-light pt-4">
                  {answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
