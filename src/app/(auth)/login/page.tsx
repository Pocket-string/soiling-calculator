import Link from 'next/link'
import { LoginForm } from '@/features/auth/components'

export const metadata = { title: 'Iniciar sesión | Soiling Calc' }

interface Props {
  searchParams: Promise<{ registered?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const justRegistered = params.registered === 'true'

  return (
    <div className="space-y-8">
      {/* Logo movil */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-foreground">Soiling Calc</span>
      </div>

      {/* Success banner after invite registration */}
      {justRegistered && (
        <div className="rounded-lg bg-success-50 border border-success-100 px-4 py-3 text-sm text-success-700">
          Cuenta creada correctamente. Inicia sesión con tus credenciales.
        </div>
      )}

      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold text-foreground">Bienvenido de vuelta</h1>
        <p className="mt-2 text-foreground-secondary">Inicia sesión en tu cuenta para continuar</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-foreground-secondary">
        Acceso solo por invitación.{' '}
        <Link href="/apply" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
          Solicitar acceso
        </Link>
      </p>
    </div>
  )
}
