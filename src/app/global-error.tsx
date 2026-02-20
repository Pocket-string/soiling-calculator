'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <p className="text-6xl font-bold text-error-500 mb-4">!</p>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Error crítico
            </h1>
            <p className="text-foreground-secondary mb-8">
              Ha ocurrido un error inesperado en la aplicación. Intenta recargar la página.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
