import { siteConfig } from '@/config/siteConfig'

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-light py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-muted">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-primary-500 inline-flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </span>
          <span className="font-medium text-foreground-secondary">Soiling Calc</span>
          <span>© 2025</span>
        </div>
        <div className="flex gap-6">
          <a href="/demo" className="hover:text-foreground-secondary transition-colors">
            Demo
          </a>
          <a href="/apply" className="hover:text-foreground-secondary transition-colors">
            Postular
          </a>
          <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-foreground-secondary transition-colors">
            Contacto
          </a>
        </div>
      </div>
    </footer>
  )
}
