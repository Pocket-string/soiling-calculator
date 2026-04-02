interface Props {
  onboardingCompleted: boolean
  plantCount: number
  readingCount: number
}

const MILESTONES = [
  { key: 'account', label: 'Cuenta creada' },
  { key: 'onboarding', label: 'Perfil completado' },
  { key: 'plant', label: 'Planta creada' },
  { key: 'reading', label: 'Primera lectura' },
  { key: 'soiling', label: 'Calculo de soiling' },
]

export function ActivationProgress({ onboardingCompleted, plantCount, readingCount }: Props) {
  const completed = [
    true, // account always done
    onboardingCompleted,
    plantCount > 0,
    readingCount > 0,
    readingCount >= 2,
  ]

  const completedCount = completed.filter(Boolean).length

  // Don't show if fully activated
  if (completedCount === MILESTONES.length) return null

  return (
    <div className="mb-6 p-4 rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Progreso de activacion</p>
        <span className="text-xs text-foreground-muted">{completedCount}/{MILESTONES.length} completados</span>
      </div>
      <div className="flex items-center gap-1">
        {MILESTONES.map((milestone, i) => {
          const done = completed[i]
          return (
            <div key={milestone.key} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? 'bg-success-500 text-white'
                    : 'bg-surface-alt text-foreground-muted border border-border'
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {/* Label */}
              <span className={`text-[10px] sm:text-xs text-center leading-tight ${done ? 'text-success-600 font-medium' : 'text-foreground-muted'}`}>
                {milestone.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
