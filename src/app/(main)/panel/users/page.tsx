import { requireAdmin } from '@/lib/auth'
import { getUserEngagement } from '@/actions/engagement'
import { KpiCard } from '@/components/ui/kpi-card'
import { UsersTable } from './UsersTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Engagement | Admin — Soiling Calc' }

export default async function AdminUsersPage() {
  await requireAdmin()

  const users = await getUserEngagement()

  const stats = {
    total: users.length,
    active: users.filter((u) => u.engagementStatus === 'active').length,
    stalled: users.filter((u) => u.engagementStatus === 'stalled').length,
    dormant: users.filter((u) => u.engagementStatus === 'dormant').length,
    churning: users.filter((u) => u.engagementStatus === 'churning').length,
    activationRate:
      users.length > 0
        ? Math.round((users.filter((u) => u.readingCount > 0).length / users.length) * 100)
        : 0,
    avgTrialDays:
      users.filter((u) => u.trialDaysLeft !== null).length > 0
        ? Math.round(
            users
              .filter((u) => u.trialDaysLeft !== null)
              .reduce((sum, u) => sum + (u.trialDaysLeft ?? 0), 0) /
              users.filter((u) => u.trialDaysLeft !== null).length,
          )
        : 0,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Engagement de usuarios</h1>
        <p className="text-sm text-foreground-secondary mt-0.5">
          Estado de activacion de founding users
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <KpiCard label="Total" value={String(stats.total)} />
        <KpiCard label="Activos" value={String(stats.active)} />
        <KpiCard label="Estancados" value={String(stats.stalled)} alert={stats.stalled > 0} />
        <KpiCard label="Dormidos" value={String(stats.dormant)} alert={stats.dormant > 0} />
        <KpiCard label="Churning" value={String(stats.churning)} alert={stats.churning > 0} />
        <KpiCard
          label="Tasa activacion"
          value={`${stats.activationRate}%`}
          alert={stats.activationRate < 30}
        />
        <KpiCard label="Avg trial left" value={`${stats.avgTrialDays}d`} />
      </div>

      {/* Table */}
      <UsersTable users={users} />
    </div>
  )
}
