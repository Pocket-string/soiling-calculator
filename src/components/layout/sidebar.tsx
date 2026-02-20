'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isAdmin?: boolean
  trialDaysLeft?: number | null
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: '/plants', label: 'Mis Plantas', icon: SunIcon },
  { href: '/plants/new', label: 'Nueva Planta', icon: PlusIcon },
]

const adminItems = [
  { href: '/admin/leads', label: 'Gestion Leads', icon: UsersIcon },
  { href: '/admin/funnel', label: 'Funnel', icon: ChartBarIcon },
]

export function Sidebar({
  collapsed,
  onToggle,
  isAdmin = false,
  trialDaysLeft = null,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email ?? '')
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNavClick = () => {
    onMobileClose?.()
  }

  const initials = userEmail.slice(0, 2).toUpperCase() || '??'

  const trialColor =
    trialDaysLeft === null ? null
      : trialDaysLeft < 7 ? 'text-error-500'
        : trialDaysLeft < 15 ? 'text-amber-400'
          : 'text-slate-500'

  return (
    <aside
      role="navigation"
      aria-label="Menu principal"
      className={[
        'fixed left-0 top-0 bottom-0 bg-slate-900 text-white flex flex-col z-40',
        'transition-all duration-300 ease-in-out',
        // Mobile: full-width drawer, translate-based visibility
        'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: always visible, width based on collapsed
        'md:translate-x-0',
        collapsed ? 'md:w-16' : 'md:w-64',
      ].join(' ')}
    >
      {/* Logo + collapse/close buttons */}
      <div className={`flex items-center h-16 border-b border-white/10 ${collapsed ? 'md:justify-center md:px-0' : ''} ${!collapsed || mobileOpen ? 'justify-between px-5' : 'justify-center px-0'}`}>
        <Link
          href="/plants"
          className="flex items-center gap-3 min-w-0"
          title={collapsed && !mobileOpen ? 'Soiling Calc' : undefined}
          onClick={handleNavClick}
        >
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <SunIcon className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight text-white">Soiling Calc</p>
              <p className="text-[10px] text-slate-400 leading-tight">Calculadora Solar</p>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors md:hidden"
            aria-label="Cerrar menu"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse button */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-6 h-6 items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 hidden md:flex"
            title="Colapsar menu"
            aria-label="Colapsar menu"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Desktop expand button (only when collapsed) */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-1.5 w-8 h-6 items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors hidden md:flex"
          title="Expandir menu"
          aria-label="Expandir menu"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      )}

      {/* User info */}
      <div className={`border-b border-white/10 ${collapsed && !mobileOpen ? 'py-3 flex flex-col items-center gap-1' : 'px-4 py-3'}`}>
        {collapsed && !mobileOpen ? (
          <div
            title={userEmail}
            className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center"
          >
            <span className="text-xs font-bold text-amber-300">{initials}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-amber-300">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{userEmail || 'Cargando...'}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${isAdmin ? 'bg-success-500/15 text-success-500 border-success-500/20' : 'bg-warning-500/15 text-warning-500 border-warning-500/20'}`}>
                  {isAdmin ? 'Admin' : 'Usuario'}
                </span>
              </div>
            </div>
            {trialDaysLeft !== null && trialColor && (
              <p className={`text-[10px] mt-1.5 pl-11 ${trialColor}`}>
                {trialDaysLeft === 0
                  ? 'Trial expirado'
                  : `${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} de trial`}
              </p>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/plants' &&
              pathname.startsWith('/plants') &&
              pathname !== '/plants/new')
          const Icon = item.icon
          const isCollapsedDesktop = collapsed && !mobileOpen
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              title={isCollapsedDesktop ? item.label : undefined}
              className={[
                'flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 border-l-2',
                isCollapsedDesktop ? 'justify-center px-2.5 border-transparent' : 'px-3',
                isActive
                  ? 'bg-white/10 text-white border-amber-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent',
              ].join(' ')}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsedDesktop && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className={`pt-3 pb-1 ${collapsed && !mobileOpen ? 'px-2' : 'px-3'}`}>
              {collapsed && !mobileOpen ? (
                <div className="border-t border-white/10" />
              ) : (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Admin
                </p>
              )}
            </div>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              const isCollapsedDesktop = collapsed && !mobileOpen
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  title={isCollapsedDesktop ? item.label : undefined}
                  className={[
                    'flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 border-l-2',
                    isCollapsedDesktop ? 'justify-center px-2.5 border-transparent' : 'px-3',
                    isActive
                      ? 'bg-white/10 text-white border-amber-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent',
                  ].join(' ')}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsedDesktop && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 space-y-0.5">
        <Link
          href="/settings"
          onClick={handleNavClick}
          title={collapsed && !mobileOpen ? 'Configuración' : undefined}
          aria-label="Configuración"
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 ${collapsed && !mobileOpen ? 'justify-center' : ''} ${
            pathname === '/settings'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <GearIcon className="w-5 h-5 flex-shrink-0" />
          {(!(collapsed) || mobileOpen) && <span className="text-sm font-medium">Configuración</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={collapsed && !mobileOpen ? 'Cerrar Sesión' : undefined}
          aria-label="Cerrar sesión"
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-200 ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
        >
          <LogoutIcon className="w-5 h-5 flex-shrink-0" />
          {(!(collapsed) || mobileOpen) && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
