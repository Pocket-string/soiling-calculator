import { requireAuth, getProfile } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ProfileForm } from '@/features/settings/components/ProfileForm'
import { ChangePasswordForm } from '@/features/settings/components/ChangePasswordForm'
import { NotificationPreferencesForm } from '@/features/settings/components/NotificationPreferencesForm'
import { ApiKeysManager } from '@/features/settings/components/ApiKeysManager'
import { getNotificationPreferences } from '@/actions/notifications'
import { listApiKeys } from '@/actions/api-keys'

export const metadata = { title: 'Configuración | Soiling Calc' }

const ACCESS_LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  founding: { label: 'Founding', color: 'bg-warning-100 text-warning-700' },
  admin: { label: 'Admin', color: 'bg-success-100 text-success-700' },
  paid: { label: 'Pagado', color: 'bg-blue-100 text-blue-700' },
  free: { label: 'Gratuito', color: 'bg-surface-alt text-foreground-secondary' },
}

export default async function SettingsPage() {
  const user = await requireAuth()
  const profile = await getProfile(user.id)
  const notifPrefs = await getNotificationPreferences()
  const apiKeys = await listApiKeys()

  const accessLevel = profile?.access_level ?? 'free'
  const levelInfo = ACCESS_LEVEL_LABELS[accessLevel] ?? ACCESS_LEVEL_LABELS.free

  // Compute trial days
  let trialInfo = 'Sin limite'
  if (profile?.trial_ends_at && accessLevel !== 'admin' && accessLevel !== 'paid') {
    const daysLeft = Math.ceil(
      (new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    trialInfo = daysLeft > 0 ? `${daysLeft} días restantes` : 'Expirado'
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-foreground-secondary text-sm mt-1">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Mi Cuenta</CardTitle>
          <CardDescription>Información de tu cuenta y plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Form */}
          <ProfileForm initialName={profile?.full_name ?? null} />

          {/* Readonly fields */}
          <div className="border-t border-border-light pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Email</span>
              <span className="text-sm font-medium text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Plan</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelInfo.color}`}>
                {levelInfo.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Trial</span>
              <span className="text-sm text-foreground">{trialInfo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Plantas permitidas</span>
              <span className="text-sm font-medium text-foreground">{profile?.max_plants ?? 1}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>Cambia tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Alertas por Email */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas por Email</CardTitle>
          <CardDescription>Configura alertas automaticas de soiling para tus plantas</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm initialPrefs={notifPrefs} />
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Gestiona tus API keys para acceder a la API REST</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeysManager initialKeys={apiKeys} />
        </CardContent>
      </Card>
    </div>
  )
}
