'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import MembersBell from './MembersBell'

export default function MembersHeader({
  isAdmin,
  userName,
}: {
  isAdmin: boolean
  userName: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/members/login')
  }

  return (
    <header style={{ background: '#1a2332' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href={isAdmin ? '/members/admin' : '/members/mi-membresia'} className="flex items-center gap-2">
            <div className="relative w-24 h-8">
              <Image
                src="/logo/logo-oruga-sin-fondo.png"
                alt="Oruga Cowork"
                fill
                className="object-contain object-left brightness-0 invert"
              />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
              style={{ background: '#c5e84a', color: '#1a2332' }}>
              Members
            </span>
          </Link>
          <Link
            href="/home"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
            style={{ color: 'rgba(197,232,74,0.7)', border: '1px solid rgba(197,232,74,0.2)' }}
          >
            ← Ir al calendario
          </Link>
        </div>

        {isAdmin && (
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { href: '/members/admin', label: '⭐ Membresías' },
              { href: '/members/registros', label: '📝 Registros' },
              { href: '/members/finanzas', label: '💰 Finanzas' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === link.href ? 'text-white' : 'text-blue-300 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === link.href ? { background: 'rgba(197,232,74,0.2)', color: '#c5e84a' } : {}}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <MembersBell isAdmin={isAdmin} />
          <span className="hidden sm:block text-xs text-blue-300 font-medium truncate max-w-32">
            {userName}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: isAdmin ? '#c5e84a' : 'rgba(255,255,255,0.15)', color: isAdmin ? '#1a2332' : '#fff' }}>
            {isAdmin ? '🛠 Admin' : '👤 Miembro'}
          </span>
          <button
            onClick={handleLogout}
            className="hidden sm:block text-xs text-blue-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Salir
          </button>
          <button onClick={() => setMenuOpen(o => !o)}
            className="sm:hidden p-2 rounded-lg text-blue-300 hover:bg-white/10">
            <div className="w-4 space-y-1">
              <span className="block h-0.5 bg-current" />
              <span className="block h-0.5 bg-current" />
              <span className="block h-0.5 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-white/10 px-4 py-3 space-y-1">
          <Link href="/home" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl"
            style={{ color: '#c5e84a', background: 'rgba(197,232,74,0.08)' }}>
            ← Ir al calendario
          </Link>
          {isAdmin && (
            <>
              {[
                { href: '/members/admin', label: '⭐ Membresías' },
                { href: '/members/registros', label: '📝 Registros' },
                { href: '/members/finanzas', label: '💰 Finanzas' },
              ].map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === link.href ? '' : 'text-blue-300 hover:text-white hover:bg-white/10'}`}
                  style={pathname === link.href ? { background: 'rgba(197,232,74,0.15)', color: '#c5e84a' } : {}}>
                  {link.label}
                </Link>
              ))}
            </>
          )}
          <div className="border-t border-white/10 pt-2 mt-2">
            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm text-red-300 hover:bg-white/10 rounded-xl">
              🚪 Salir
            </button>
          </div>
        </div>
      )}
    </header>
  )
}'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import MembersBell from './MembersBell'

export default function MembersHeader({
  isAdmin,
  userName,
}: {
  isAdmin: boolean
  userName: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/members/login')
  }

  return (
    <header style={{ background: '#1a2332' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href={isAdmin ? '/members/admin' : '/members/mi-membresia'} className="flex items-center gap-2">
          <div className="relative w-24 h-8">
            <Image
              src="/logo/logo-oruga-sin-fondo.png"
              alt="Oruga Cowork"
              fill
              className="object-contain object-left brightness-0 invert"
            />
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
            style={{ background: '#c5e84a', color: '#1a2332' }}>
            Members
          </span>
        </Link>

        {/* Nav links (admin) */}
        {isAdmin && (
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { href: '/members/admin',      label: '⭐ Membresías' },
              { href: '/members/registros',  label: '📝 Registros' },
              { href: '/members/finanzas',   label: '💰 Finanzas' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === link.href ? 'text-white' : 'text-blue-300 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === link.href ? { background: 'rgba(197,232,74,0.2)', color: '#c5e84a' } : {}}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <MembersBell isAdmin={isAdmin} />
          <span className="hidden sm:block text-xs text-blue-300 font-medium truncate max-w-32">
            {userName}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: isAdmin ? '#c5e84a' : 'rgba(255,255,255,0.15)', color: isAdmin ? '#1a2332' : '#fff' }}>
            {isAdmin ? '🛠 Admin' : '👤 Miembro'}
          </span>
          <button
            onClick={handleLogout}
            className="hidden sm:block text-xs text-blue-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Salir
          </button>
          {/* Hamburguesa mobile */}
          {isAdmin && (
            <button onClick={() => setMenuOpen(o => !o)}
              className="sm:hidden p-2 rounded-lg text-blue-300 hover:bg-white/10">
              <div className="w-4 space-y-1">
                <span className="block h-0.5 bg-current" />
                <span className="block h-0.5 bg-current" />
                <span className="block h-0.5 bg-current" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && isAdmin && (
        <div className="sm:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {[
            { href: '/members/admin',     label: '⭐ Membresías' },
            { href: '/members/registros', label: '📝 Registros' },
            { href: '/members/finanzas',  label: '💰 Finanzas' },
          ].map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === link.href ? '' : 'text-blue-300 hover:text-white hover:bg-white/10'}`}
              style={pathname === link.href ? { background: 'rgba(197,232,74,0.15)', color: '#c5e84a' } : {}}>
              {link.label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-2 mt-2">
            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm text-red-300 hover:bg-white/10 rounded-xl">
              🚪 Salir
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
