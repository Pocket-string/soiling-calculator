interface KpiCardProps {
  label: string
  value: string
  alert?: boolean
  icon?: (props: { className?: string }) => React.ReactElement
  sub?: string
}

export function KpiCard({ label, value, alert = false, icon: Icon, sub }: KpiCardProps) {
  return (
    <div className="relative bg-surface rounded-lg border border-border shadow-card p-4 flex flex-col justify-between min-h-[100px] overflow-hidden">
      {Icon && (
        <div className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center ${alert ? 'bg-error-50' : 'bg-surface-alt'}`}>
          <Icon className={`w-4 h-4 ${alert ? 'text-error-500' : 'text-foreground-muted'}`} />
        </div>
      )}
      <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest pr-10">{label}</p>
      <p className={`text-2xl font-bold font-mono tabular-nums tracking-tight mt-1 ${alert ? 'text-error-600' : 'text-foreground'}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-foreground-muted mt-1.5 border-t border-border-light pt-1.5 truncate">
          {sub}
        </p>
      )}
    </div>
  )
}
