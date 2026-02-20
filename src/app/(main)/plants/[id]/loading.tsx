export default function PlantDetailLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="h-4 w-20 bg-surface-alt rounded" />
          <div className="h-7 w-48 bg-surface-alt rounded-lg mt-2" />
          <div className="h-4 w-36 bg-surface-alt rounded mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-surface-alt rounded-lg" />
          <div className="h-10 w-36 bg-surface-alt rounded-lg" />
        </div>
      </div>

      {/* Recommendation card */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-surface-alt rounded" />
              <div className="h-7 w-20 bg-surface-alt rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts area */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-5">
            <div className="h-5 w-32 bg-surface-alt rounded mb-4" />
            <div className="h-48 bg-surface-alt rounded" />
          </div>
        ))}
      </div>

      {/* Readings table */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="h-5 w-40 bg-surface-alt rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-16 bg-surface-alt rounded" />
              <div className="h-4 w-12 bg-surface-alt rounded" />
              <div className="h-4 w-12 bg-surface-alt rounded" />
              <div className="h-4 w-12 bg-surface-alt rounded" />
              <div className="h-4 w-12 bg-surface-alt rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
