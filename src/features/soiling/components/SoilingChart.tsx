'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ProductionReading } from '@/features/readings/types'
import { chartColors, chartTooltipStyle, chartTooltipLabelStyle } from '@/lib/tokens/chart-colors'

interface Props {
  readings: ProductionReading[]
}

interface ChartPoint {
  date: string
  soiling: number | null
  pr: number | null
  prBaseline: number | null
  isCleaning: boolean
}

export default function SoilingChart({ readings }: Props) {
  // Ordenar cronológicamente (funciona sin importar si llegan ASC o DESC)
  const sorted = [...readings].sort((a, b) => a.reading_date.localeCompare(b.reading_date))

  const data: ChartPoint[] = sorted.map((r) => ({
    date: new Date(r.reading_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    soiling: r.soiling_percent !== null ? parseFloat(r.soiling_percent.toFixed(2)) : null,
    pr: r.pr_current !== null ? parseFloat((r.pr_current * 100).toFixed(1)) : null,
    prBaseline: r.pr_baseline !== null ? parseFloat((r.pr_baseline * 100).toFixed(1)) : null,
    isCleaning: r.is_cleaning_day,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-foreground-muted text-sm">
        Sin datos suficientes para graficar
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gráfico Soiling % */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
            Soiling acumulado (%)
          </h4>
          <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill={chartColors.cleaning} stroke="white" strokeWidth="1.5" />
            </svg>
            Día de limpieza
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: chartColors.axisLabel }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: chartColors.axisLabel }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}%` : '—', 'Soiling']}
              labelStyle={chartTooltipLabelStyle}
              contentStyle={chartTooltipStyle}
              itemStyle={{ color: chartColors.tooltip.text }}
            />
            <ReferenceLine y={7} stroke={chartColors.thresholdWarning} strokeDasharray="4 4" label={{ value: 'Limpiar', position: 'right', fontSize: 10, fill: chartColors.thresholdWarning }} />
            <ReferenceLine y={15} stroke={chartColors.thresholdUrgent} strokeDasharray="4 4" label={{ value: 'Urgente', position: 'right', fontSize: 10, fill: chartColors.thresholdUrgent }} />
            <Line
              type="monotone"
              dataKey="soiling"
              name="Soiling %"
              stroke={chartColors.soiling}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props as unknown as { cx: number | undefined; cy: number | undefined; payload: ChartPoint }
                if (cx == null || cy == null) return <g />
                if (payload.isCleaning) {
                  return (
                    <g key={`clean-${payload.date}`}>
                      <circle cx={cx} cy={cy} r={chartColors.cleaningDotRadius} fill={chartColors.cleaning} stroke="white" strokeWidth={2} />
                    </g>
                  )
                }
                return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={chartColors.dotRadius} fill={chartColors.soiling} />
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico Performance Ratio */}
      <div>
        <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-3">
          Performance Ratio (%)
        </h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: chartColors.axisLabel }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: chartColors.axisLabel }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                value != null ? `${value.toFixed(1)}%` : '—',
                name === 'pr' ? 'PR actual' : 'PR limpio (baseline)',
              ]}
              labelStyle={chartTooltipLabelStyle}
              contentStyle={chartTooltipStyle}
              itemStyle={{ color: chartColors.tooltip.text }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: chartColors.axisLabel }}
              formatter={(value) => value === 'pr' ? 'PR actual' : 'Baseline limpio'}
            />
            <Line
              type="monotone"
              dataKey="prBaseline"
              name="prBaseline"
              stroke={chartColors.prBaseline}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="pr"
              name="pr"
              stroke={chartColors.pr}
              strokeWidth={2}
              dot={{ r: chartColors.dotRadius, fill: chartColors.pr }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
