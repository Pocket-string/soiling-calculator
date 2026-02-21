import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRateLimiter } from '@/lib/rate-limit'
import type { ProductionReading } from '@/features/readings/types'

const checkExportLimit = createRateLimiter(10, 5 * 60 * 1000) // 10 req / 5 min

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function buildCsv(readings: ProductionReading[]): string {
  const headers = [
    'fecha',
    'tipo',
    'kwh_real',
    'kwh_teorico',
    'pr_actual_%',
    'pr_baseline_%',
    'soiling_%',
    'perdida_kwh',
    'perdida_eur',
    'acumulado_eur',
    'dias_break_even',
    'recomendacion',
    'dia_limpieza',
    'irradiancia_kwh_m2',
    'temp_media_c',
    't_celda_c',
  ]

  const rows = readings.map((r) => [
    formatDate(r.reading_date),
    r.reading_type,
    r.kwh_real?.toFixed(3) ?? '',
    r.kwh_theoretical?.toFixed(3) ?? '',
    r.pr_current != null ? (r.pr_current * 100).toFixed(2) : '',
    r.pr_baseline != null ? (r.pr_baseline * 100).toFixed(2) : '',
    r.soiling_percent?.toFixed(2) ?? '',
    r.kwh_loss?.toFixed(3) ?? '',
    r.loss_eur?.toFixed(4) ?? '',
    r.cumulative_loss_eur?.toFixed(4) ?? '',
    r.days_to_breakeven?.toString() ?? '',
    r.cleaning_recommendation ?? '',
    r.is_cleaning_day ? 'sí' : 'no',
    r.irradiance_kwh_m2?.toFixed(3) ?? '',
    r.temp_ambient_c?.toFixed(1) ?? '',
    r.t_cell_c?.toFixed(1) ?? '',
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Rate limit by IP
  const ip = _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || _request.headers.get('x-real-ip')
    || 'unknown'
  if (!checkExportLimit(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar ownership de la planta
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('name, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 })
  }

  // Obtener todas las lecturas
  const { data: readings, error: readingsError } = await supabase
    .from('production_readings')
    .select('*')
    .eq('plant_id', id)
    .eq('user_id', user.id)
    .order('reading_date', { ascending: true })

  if (readingsError) {
    return NextResponse.json({ error: readingsError.message }, { status: 500 })
  }

  const csv = buildCsv((readings ?? []) as ProductionReading[])
  const safeName = (plant.name as string).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const filename = `soiling-${safeName}-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
