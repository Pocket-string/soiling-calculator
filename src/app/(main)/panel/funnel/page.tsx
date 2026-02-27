import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Funnel | Soiling Calc' }

const FUNNEL_EVENTS = [
  { key: 'LEAD_APPLIED', label: 'Leads', color: 'bg-blue-500' },
  { key: 'LEAD_INVITED', label: 'Invitados', color: 'bg-warning-500' },
  { key: 'INVITE_CONSUMED', label: 'Activados', color: 'bg-success-500' },
  { key: 'PLANT_CREATED', label: 'Plantas', color: 'bg-violet-500' },
  { key: 'READING_CREATED', label: 'Lecturas', color: 'bg-rose-500' },
] as const

interface EventCount {
  event_name: string
  total: number
  last_7d: number
  last_30d: number
}

interface FunnelEvent {
  id: string
  event_name: string
  user_id: string | null
  lead_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

async function getFunnelData(): Promise<{ counts: EventCount[]; recent: FunnelEvent[] }> {
  const supabase = createServiceClient()
  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const counts: EventCount[] = []

  for (const evt of FUNNEL_EVENTS) {
    const [totalRes, d7Res, d30Res] = await Promise.all([
      supabase.from('funnel_events').select('*', { count: 'exact', head: true }).eq('event_name', evt.key),
      supabase.from('funnel_events').select('*', { count: 'exact', head: true }).eq('event_name', evt.key).gte('created_at', d7),
      supabase.from('funnel_events').select('*', { count: 'exact', head: true }).eq('event_name', evt.key).gte('created_at', d30),
    ])

    counts.push({
      event_name: evt.key,
      total: totalRes.count ?? 0,
      last_7d: d7Res.count ?? 0,
      last_30d: d30Res.count ?? 0,
    })
  }

  const { data: recent } = await supabase
    .from('funnel_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  return { counts, recent: (recent ?? []) as FunnelEvent[] }
}

function conversionRate(from: number, to: number): string {
  if (from === 0) return '-'
  return `${Math.round((to / from) * 100)}%`
}

export default async function FunnelPage() {
  await requireAdmin()
  const { counts, recent } = await getFunnelData()

  const countMap = Object.fromEntries(counts.map((c) => [c.event_name, c]))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Funnel de Conversión</h1>
        <p className="text-foreground-secondary text-sm mt-1">Métricas del flujo de usuarios desde aplicación hasta uso activo</p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {FUNNEL_EVENTS.map((evt) => {
          const c = countMap[evt.key]
          return (
            <Card key={evt.key}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${evt.color}`} />
                  <span className="text-xs font-medium text-foreground-secondary">{evt.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{c?.total ?? 0}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-foreground-muted">7d: {c?.last_7d ?? 0}</span>
                  <span className="text-xs text-foreground-muted">30d: {c?.last_30d ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasas de Conversión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {FUNNEL_EVENTS.map((evt, i) => {
              const c = countMap[evt.key]
              const prev = i > 0 ? countMap[FUNNEL_EVENTS[i - 1].key] : null
              return (
                <div key={evt.key} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="text-foreground-muted font-mono text-xs px-1">
                      {conversionRate(prev?.total ?? 0, c?.total ?? 0)}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 rounded-full bg-surface-alt border border-border px-3 py-1.5">
                    <div className={`w-2 h-2 rounded-full ${evt.color}`} />
                    <span className="font-medium text-foreground-secondary">{evt.label}</span>
                    <span className="text-foreground-muted font-mono text-xs">{c?.total ?? 0}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-foreground-muted text-center py-4">No hay eventos registrados aún.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((evt) => {
                const def = FUNNEL_EVENTS.find((f) => f.key === evt.event_name)
                const meta = evt.metadata as Record<string, unknown>
                const email = meta?.email as string | undefined
                const date = new Date(evt.created_at)
                return (
                  <div key={evt.id} className="flex items-center gap-3 py-2 border-b border-border-light last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${def?.color ?? 'bg-foreground-muted'}`} />
                    <span className="text-xs font-medium text-foreground-secondary w-32 flex-shrink-0">
                      {def?.label ?? evt.event_name}
                    </span>
                    <span className="text-xs text-foreground-muted flex-1 truncate">
                      {email ?? evt.user_id?.slice(0, 8) ?? evt.ip_address ?? '-'}
                    </span>
                    <span className="text-xs text-foreground-muted flex-shrink-0 tabular-nums">
                      {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}{' '}
                      {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
