'use client'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-error-500 mb-4">!</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Algo salió mal
        </h1>
        <p className="text-foreground-secondary mb-8">
          Ha ocurrido un error inesperado. Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Intentar de nuevo
          </button>
          <a
            href="/plants"
            className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground-secondary hover:bg-surface-alt transition-colors"
          >
            Ir a Mis Plantas
          </a>
        </div>
      </div>
    </div>
  )
}
