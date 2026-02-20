import Link from 'next/link'

export const metadata = {
  title: 'Lista de espera — Soiling Calc',
}

export default function WaitlistPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-6">
      <div className="text-5xl">⏳</div>
      <h1 className="text-3xl font-bold text-foreground">Lista de espera</h1>
      <p className="text-foreground-secondary text-lg leading-relaxed">
        Las 10 plazas del programa Founding 10 están actualmente ocupadas. Hemos recibido tu
        interés y te contactaremos en cuanto haya una plaza disponible.
      </p>
      <div className="bg-primary-50 border border-primary-200 rounded-lg px-6 py-5 text-sm text-primary-700 text-left space-y-2">
        <p className="font-semibold">¿Qué pasa ahora?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tu solicitud ha quedado registrada</li>
          <li>Te avisamos por email cuando haya plaza</li>
          <li>Los Founding Members tienen prioridad de invitación</li>
        </ul>
      </div>
      <Link
        href="/demo"
        className="inline-block px-6 py-3 rounded-lg border-2 border-border text-foreground-secondary font-medium hover:border-border hover:bg-surface-alt transition-colors"
      >
        Ver demo mientras tanto →
      </Link>
    </div>
  )
}
