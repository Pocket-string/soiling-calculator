import Link from 'next/link'
import { getInviteByToken } from '@/actions/invites'
import { InviteForm } from '@/features/invites/components/InviteForm'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata = { title: 'Activar Cuenta | Soiling Calc' }

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const { invite, error } = await getInviteByToken(token)

  if (error || !invite) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-error-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Invitación no válida</h1>
        <p className="text-foreground-secondary text-sm">
          {error || 'Este enlace de invitación no es válido o ha expirado.'}
        </p>
        <Link
          href="/apply"
          className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          Solicitar acceso
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activa tu cuenta</h1>
        <p className="text-foreground-secondary text-sm mt-1">
          Hola <span className="font-medium text-foreground">{invite.name}</span>, elige una contraseña para acceder a Soiling Calc.
        </p>
      </div>
      <InviteForm token={invite.token} defaultName={invite.name} email={invite.email} />
    </div>
  )
}
