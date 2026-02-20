'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { siteConfig } from '@/config/siteConfig'
import { SunIcon, ChevronDownIcon, MenuIcon } from './icons'
import { MobileMenu } from './MobileMenu'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <nav className={`sticky top-0 z-50 bg-surface transition-shadow duration-300 ${scrolled ? 'shadow-elevated' : 'shadow-card'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <SunIcon className="w-8 h-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
              <div>
                <span className="font-heading text-xl font-bold text-slate-800 tracking-tight">
                  {siteConfig.firmName.split(' ')[0]}
                </span>
                <span className="font-heading text-xl font-light text-foreground-secondary tracking-tight ml-1">
                  {siteConfig.firmName.split(' ').slice(1).join(' ')}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
              {siteConfig.navigation.items.map((item) => (
                <div key={item.label} className="relative">
                  {item.children ? (
                    <>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        className={`flex items-center gap-1 px-4 py-2 text-body-sm font-medium uppercase tracking-wider transition-colors ${
                          openDropdown === item.label ? 'text-primary-600' : 'text-foreground-secondary hover:text-primary-600'
                        }`}
                      >
                        {item.label}
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                      </button>
                      {openDropdown === item.label && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-surface rounded-lg shadow-elevated border border-border-light py-2 animate-fade-in">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="block px-4 py-2.5 text-body-sm text-foreground-secondary hover:bg-primary-50 hover:text-primary-700 transition-colors"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="px-4 py-2 text-body-sm font-medium uppercase tracking-wider text-foreground-secondary hover:text-primary-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <Link
                href="/login"
                className="ml-4 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-body-sm font-semibold rounded-lg transition-colors"
              >
                Mi Cuenta
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-foreground-secondary hover:text-primary-600 transition-colors"
              aria-label="Abrir menú"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
