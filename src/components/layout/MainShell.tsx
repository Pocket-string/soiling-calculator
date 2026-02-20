'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { siteConfig } from '@/config/siteConfig'

interface MainShellProps {
  children: React.ReactNode
  isAdmin?: boolean
  trialDaysLeft?: number | null
  trialExpired?: boolean
}

export function MainShell({
  children,
  isAdmin = false,
  trialDaysLeft = null,
  trialExpired = false,
}: MainShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Trial expired banner (inline, not fixed) */}
      {trialExpired && (
        <div className="bg-error-600 text-white text-sm text-center py-2.5 px-4">
          Tu período de prueba ha expirado.{' '}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="underline font-semibold hover:text-error-100 transition-colors"
          >
            Contactanos
          </a>{' '}
          para continuar usando Soiling Calc.
        </div>
      )}

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        isAdmin={isAdmin}
        trialDaysLeft={trialDaysLeft}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div
        className={`flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out ml-0 ${
          collapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center h-14 px-4 bg-surface border-b border-border md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-foreground-muted hover:bg-surface-alt transition-colors"
            aria-label="Abrir menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-sm text-foreground">Soiling Calc</span>
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
