'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ProductionReading } from '@/features/readings/types'
import { chartColors, chartTooltipStyle, chartTooltipLabelStyle } from '@/lib/tokens/chart-colors'

interface Props {
  readings: ProductionReading[]
  currencySymbol?: string
}

export default function LossesChart({ readings, currencySymbol = '€' }: Props) {
  const sorted = [...readings]
    .sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    .slice(-30) // últimos 30

  const data = sorted.map((r) => ({
    date: new Date(r.reading_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    loss: r.loss_eur !== null ? parseFloat(r.loss_eur.toFixed(2)) : 0,
    isCleaning: r.is_cleaning_day,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-foreground-muted text-sm">
        Sin datos para mostrar
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-3">
        Perdida economica por dia ({currencySymbol})
      </h4>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: chartColors.axisLabel }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: chartColors.axisLabel }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}${currencySymbol}`}
          />
          <Tooltip
            formatter={(value: number | undefined) => [value != null ? `${value.toFixed(2)}${currencySymbol}` : '—', 'Perdida por soiling']}
            labelStyle={chartTooltipLabelStyle}
            contentStyle={chartTooltipStyle}
            itemStyle={{ color: chartColors.tooltip.text }}
          />
          <Bar
            dataKey="loss"
            fill={chartColors.losses}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
