import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-warning-500 mb-4">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Página no encontrada
        </h1>
        <p className="text-foreground-secondary mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/plants"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Ir a Mis Plantas
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground-secondary hover:bg-surface-alt transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
