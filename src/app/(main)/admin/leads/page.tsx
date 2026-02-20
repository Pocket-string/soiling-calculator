import { requireAdmin } from '@/lib/auth'
import { getLeads } from '@/actions/leads'
import { calculateLeadScore } from '@/features/leads/services/leadScorer'
import { KpiCard } from '@/components/ui/kpi-card'
import { LeadsTable } from './LeadsTable'

export const metadata = { title: 'Leads | Admin — Soiling Calc' }

export default async function AdminLeadsPage() {
  await requireAdmin()

  const { data: leads, error } = await getLeads()

  if (error) {
    return (
      <div className="p-6">
        <p className="text-error-600">Error cargando leads: {error}</p>
      </div>
    )
  }

  // Compute scoring stats server-side
  const scoredLeads = leads.map((l) => ({
    ...l,
    score: calculateLeadScore(l).total,
  }))

  const stats = {
    total: leads.length,
    applied: leads.filter((l) => l.status === 'applied').length,
    avgScore:
      leads.length > 0
        ? Math.round(
            scoredLeads.reduce((sum, l) => sum + l.score, 0) / leads.length,
          )
        : 0,
    qualified: scoredLeads.filter(
      (l) =>
        (l.status === 'applied' || l.status === 'qualified') && l.score >= 60,
    ).length,
    invited: leads.filter((l) => l.status === 'invited').length,
    active: leads.filter((l) => l.status === 'active').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion de leads</h1>
        <p className="text-sm text-foreground-secondary mt-0.5">
          {stats.total} postulaciones · {stats.invited + stats.active} plazas
          activas / 10 maximo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Postulados', value: stats.applied },
          { label: 'Score promedio', value: stats.avgScore },
          { label: 'Calificados (>=60)', value: stats.qualified },
          { label: 'Invitados', value: stats.invited },
          { label: 'Activos', value: stats.active },
        ].map(({ label, value }) => (
          <KpiCard key={label} label={label} value={String(value)} />
        ))}
      </div>

      {/* Tabla interactiva (Client Component) */}
      <LeadsTable leads={leads} />
    </div>
  )
}
