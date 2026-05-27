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
  { href: '/salas', label: 'Salas', icon: '🏢' },
  { href: '/bookings', label: 'Mis Reservas', icon: '📋' },
  { href: '/membership', label: 'Membresía', icon: '👥' },
]

const adminLinks = [
  { href: '/admin/dashboard', label: 'Panel Admin', icon: '🛠' },
  { href: '/admin/memberships', label: 'Membresías', icon: '⭐' },
  { href: '/admin/consumos', label: 'Consumos', icon: '☕' },
  { href: '/admin/finances', label: 'Finanzas', icon: '💰' },
  { href: '/admin/rooms', label: 'Salas', icon: '🏢' },
  { href: '/admin/users', label: 'Usuarios', icon: '👥' },
]

export default function Navbar({ isAdmin: isAdminProp = false, userName = '' }: { isAdmin?: boolean, userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  // Lee de sessionStorage al instante, luego verifica con /api/me
  const [isAdmin, setIsAdmin] = useState(() => {
    if (isAdminProp) return true
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('oruga_role') === 'admin'
    }
    return false
  })

  useEffect(() => {
    if (isAdminProp) {
      setIsAdmin(true)
      sessionStorage.setItem('oruga_role', 'admin')
      return
    }
    // Usa /api/me que bypasea RLS con service role
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        const admin = data?.role === 'admin'
        setIsAdmin(admin)
        if (admin) sessionStorage.setItem('oruga_role', 'admin')
        else sessionStorage.removeItem('oruga_role')
      })
      .catch(() => {})
  }, [isAdminProp])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav style={{ background: '#0a2744' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2">
            <div className="relative w-32 h-10">
              <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga Cowork" fill className="object-contain object-left brightness-0 invert" />
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === link.href ? { background: 'rgba(197,232,74,0.2)', color: '#c5e84a' } : {}}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <span className="w-px h-5 bg-white/20 mx-1" />
                {adminLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === link.href ? '' : 'hover:bg-white/10'
                    }`}
                    style={pathname === link.href
                      ? { background: 'rgba(197,232,74,0.2)', color: '#c5e84a' }
                      : { color: '#c5e84a' }}
                  >
                    <span className="mr-1">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell isAdmin={isAdmin} />
            <span className="hidden md:block text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: isAdmin ? '#c5e84a' : 'rgba(255,255,255,0.15)', color: isAdmin ? '#0a2744' : '#fff' }}>
              {isAdmin ? '🛠 Admin' : '👤 Cliente'}
            </span>
            <button
              onClick={handleLogout}
              className="hidden md:block text-sm text-blue-200 hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Salir
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-blue-200 hover:bg-white/10"
            >
              <div className="w-5 space-y-1">
                <span className="block h-0.5 bg-current"></span>
                <span className="block h-0.5 bg-current"></span>
                <span className="block h-0.5 bg-current"></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-2 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10"
                style={pathname === link.href ? { color: '#c5e84a', background: 'rgba(197,232,74,0.1)' } : {}}
              >
                <span>{link.icon}</span>{link.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="mx-4 my-1 border-t border-white/20" />
                <p className="px-4 text-xs font-semibold" style={{ color: '#c5e84a' }}>— ADMIN —</p>
                {adminLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10"
                    style={pathname === link.href
                      ? { color: '#c5e84a', background: 'rgba(197,232,74,0.1)' }
                      : { color: '#c5e84a' }}
                  >
                    <span>{link.icon}</span>{link.label}
                  </Link>
                ))}
              </>
            )}
            <div className="mx-4 my-1 border-t border-white/10" />
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-white/10 rounded-lg">
              🚪 Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
