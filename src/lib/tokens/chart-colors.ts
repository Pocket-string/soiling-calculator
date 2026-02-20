/**
 * Chart color tokens — single source of truth for recharts.
 *
 * Hex values required: recharts renders SVG attributes, not CSS-styled elements,
 * so CSS variables like var(--accent) don't resolve in stroke/fill props.
 */

export const chartColors = {
  // Grid & axes
  grid: '#E2E8F0',            // slate-200
  axisLabel: '#64748B',        // slate-500

  // Tooltip
  tooltip: {
    bg: '#0F172A',             // slate-900
    text: '#F8FAFC',           // slate-50
    label: '#94A3B8',          // slate-400
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    labelFontSize: 11,
  },

  // Data series
  soiling: '#F59E0B',          // amber-500 (primary accent)
  pr: '#3B82F6',               // blue-500 (secondary technical)
  prBaseline: '#94A3B8',       // slate-400 (reference, dashed)
  losses: '#F87171',           // red-400 (semantic: loss)

  // Markers & reference lines
  cleaning: '#22C55E',         // green-500 (positive event)
  thresholdWarning: '#F97316', // orange-500 (recommended threshold)
  thresholdUrgent: '#EF4444',  // red-500 (urgent threshold)

  // Dot sizes
  dotRadius: 3,
  cleaningDotRadius: 6,
} as const

/** Pre-built recharts Tooltip contentStyle */
export const chartTooltipStyle = {
  fontSize: chartColors.tooltip.fontSize,
  borderRadius: chartColors.tooltip.borderRadius,
  backgroundColor: chartColors.tooltip.bg,
  border: chartColors.tooltip.border,
  color: chartColors.tooltip.text,
} as const

/** Pre-built recharts Tooltip labelStyle */
export const chartTooltipLabelStyle = {
  color: chartColors.tooltip.label,
  fontSize: chartColors.tooltip.labelFontSize,
} as const

export type ChartColors = typeof chartColors
