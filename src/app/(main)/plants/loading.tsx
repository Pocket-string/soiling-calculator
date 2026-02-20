export default function PlantsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-surface-alt rounded-lg" />
          <div className="h-4 w-32 bg-surface-alt rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-surface-alt rounded-lg" />
      </div>

      {/* Plant cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-surface-alt rounded" />
              <div className="h-5 w-16 bg-surface-alt rounded-full" />
            </div>
            <div className="h-4 w-24 bg-surface-alt rounded" />
            <div className="flex gap-4 mt-2">
              <div className="h-4 w-20 bg-surface-alt rounded" />
              <div className="h-4 w-20 bg-surface-alt rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
