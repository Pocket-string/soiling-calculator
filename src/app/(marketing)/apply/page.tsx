import { ApplyForm } from '@/features/leads/components/ApplyForm'

export const metadata = {
  title: 'Postular — Soiling Calc',
  description:
    'Solicita acceso gratuito a Soiling Calc. Plazas limitadas para el programa Founding 10.',
}

export default function ApplyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-1.5 text-sm text-primary-700 font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          Founding 10 — Plazas limitadas
        </div>
        <h1 className="text-3xl font-bold text-foreground">Solicita tu acceso gratuito</h1>
        <p className="mt-3 text-foreground-secondary">
          30 días de acceso completo, sin tarjeta de crédito. Cuéntanos sobre tu instalación y
          nos ponemos en contacto contigo.
        </p>
      </div>

      <div className="bg-surface rounded-lg border border-border-light shadow-sm p-8">
        <ApplyForm />
      </div>
    </div>
  )
}
