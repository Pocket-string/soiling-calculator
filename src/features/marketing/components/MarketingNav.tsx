import Link from 'next/link'
import { getOptionalUser } from '@/lib/auth'

export async function MarketingNav() {
  const user = await getOptionalUser()

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border-light">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <span className="font-semibold text-foreground tracking-tight">Soiling Calc</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/demo"
            className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground rounded-lg hover:bg-surface-alt transition-colors"
          >
            Demo
          </Link>
          {user ? (
            <Link
              href="/plants"
              className="ml-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Mi app →
            </Link>
          ) : (
            <Link
              href="/apply"
              className="ml-2 px-4 py-2 text-sm font-semibold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Postular
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
