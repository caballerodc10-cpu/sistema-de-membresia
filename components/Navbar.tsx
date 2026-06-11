'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'

const navLinks = [
  { href: '/home', label: 'Inicio', icon: '🏠' },
  { href: '/calendar', label: 'Calendario', icon: '📅' },
  { href: '/bookings', label: 'Mis Reservas', icon: '📋' },
  { href: '/members/mi-membresia', label: 'Mi Membresía', icon: '🪴', onlyClient: true },
]

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/registros', label: 'Registros', icon: '📝' },
  { href: '/admin/memberships', label: 'Membresías', icon: '🪴' },
  { href: '/admin/finances', label: 'Finanzas', icon: '💰' },
  { href: '/admin/users', label: 'Usuarios', icon: '👥' },
]

function NavPill({ link, active }: { link: { href: string; label: string; icon: string }; active: boolean }) {
  return (
    <Link
      href={link.href}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap select-none"
      style={{
        background: active ? '#c5e84a' : 'transparent',
        color: active ? '#0a2744' : 'rgba(255,255,255,0.6)',
        boxShadow: active
          ? '0 0 0 1px rgba(197,232,74,0.3), 0 0 16px rgba(197,232,74,0.35), 0 0 32px rgba(197,232,74,0.12)'
          : 'none',
        fontWeight: active ? 700 : 500,
      }}
    >
      <span style={{ fontSize: 12 }}>{link.icon}</span>
      <span>{link.label}</span>
      {active && (
        <span
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 70%)',
          }}
        />
      )}
    </Link>
  )
}

export default function Navbar({ isAdmin: isAdminProp = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(isAdminProp)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => { if (data?.role === 'admin') setIsAdmin(true) })
      .catch(() => {})
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/home') return pathname === '/home'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const visibleNavLinks = navLinks.filter(link => !('onlyClient' in link && link.onlyClient && isAdmin))

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(180deg, #0c2d52 0%, #0a2744 100%)',
        borderBottom: '1px solid rgba(197,232,74,0.08)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.3), 0 4px 24px rgba(0,0,0,0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">

          {/* Logo */}
          <Link href="/home" className="flex items-center shrink-0">
            <div className="relative w-28 h-8">
              <Image
                src="/logo/logo-oruga-sin-fondo.png"
                alt="Oruga Cowork"
                fill
                className="object-contain object-left brightness-0 invert"
              />
            </div>
          </Link>

          {/* Desktop nav — only client links as pills, NO admin scrollbar */}
          <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
            <div
              className="flex items-center gap-0.5 p-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {visibleNavLinks.map(link => (
                <NavPill key={link.href} link={link} active={isActive(link.href)} />
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell isAdmin={isAdmin} />

            {/* Role badge — desktop only */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: isAdmin ? 'rgba(197,232,74,0.12)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${isAdmin ? 'rgba(197,232,74,0.25)' : 'rgba(255,255,255,0.1)'}`,
                color: isAdmin ? '#c5e84a' : 'rgba(255,255,255,0.7)',
              }}
            >
              <span>{isAdmin ? '⚡' : '👤'}</span>
              <span>{isAdmin ? 'Admin' : 'Cliente'}</span>
            </div>

            {/* Hamburger — always visible, opens slide-down menu */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: menuOpen ? '#c5e84a' : 'rgba(255,255,255,0.7)',
                background: menuOpen ? 'rgba(197,232,74,0.1)' : 'transparent',
              }}
              aria-label="Menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className="block h-0.5 bg-current rounded-full transition-all duration-200 origin-center"
                  style={{ transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }}
                />
                <span
                  className="block h-0.5 bg-current rounded-full transition-all duration-200"
                  style={{ opacity: menuOpen ? 0 : 1 }}
                />
                <span
                  className="block h-0.5 bg-current rounded-full transition-all duration-200 origin-center"
                  style={{ transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Slide-down menu — all screen sizes */}
      {menuOpen && (
        <div
          className="py-2 px-3 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#091e38' }}
        >
          {/* Client links */}
          {visibleNavLinks.map(link => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? '#c5e84a' : 'transparent',
                  color: active ? '#0a2744' : 'rgba(255,255,255,0.7)',
                  boxShadow: active ? '0 0 16px rgba(197,232,74,0.25)' : 'none',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}

          {/* Admin links */}
          {isAdmin && (
            <>
              <div className="mx-2 my-2 border-t" style={{ borderColor: 'rgba(197,232,74,0.15)' }} />
              <p className="px-4 pb-1 text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(197,232,74,0.45)' }}>
                Admin
              </p>
              {adminLinks.map(link => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: active ? '#c5e84a' : 'rgba(197,232,74,0.05)',
                      color: active ? '#0a2744' : '#c5e84a',
                      boxShadow: active ? '0 0 16px rgba(197,232,74,0.25)' : 'none',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                )
              })}
            </>
          )}

          {/* Logout */}
          <div className="pt-1 mt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              🚪 Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
