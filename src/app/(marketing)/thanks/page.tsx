import Link from 'next/link'

export const metadata = {
  title: '¡Solicitud recibida! — Soiling Calc',
}

export default function ThanksPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-6">
      <div className="text-5xl">🎉</div>
      <h1 className="text-3xl font-bold text-foreground">¡Solicitud recibida!</h1>
      <p className="text-foreground-secondary text-lg leading-relaxed">
        Gracias por postular al programa Founding 10. Revisaremos tu solicitud y nos pondremos
        en contacto contigo en los próximos días para activar tu acceso.
      </p>

      <div className="bg-success-50 border border-success-100 rounded-lg px-6 py-5 text-sm text-success-700 text-left space-y-2">
        <p className="font-semibold">Próximos pasos</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Recibirás un email de confirmación</li>
          <li>Te enviaremos credenciales de acceso en 24-48h</li>
          <li>Tendrás 30 días de acceso completo y gratuito</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <Link
          href="/demo"
          className="px-6 py-3 rounded-lg border-2 border-border text-foreground-secondary font-medium hover:border-border hover:bg-surface-alt transition-colors"
        >
          Ver demo mientras tanto
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
