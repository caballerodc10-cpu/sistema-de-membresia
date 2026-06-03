'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
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
            <Link
              href="/members/admin"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/members/admin'
                  ? 'text-white'
                  : 'text-blue-300 hover:text-white hover:bg-white/10'
              }`}
              style={pathname === '/members/admin' ? { background: 'rgba(197,232,74,0.2)', color: '#c5e84a' } : {}}
            >
              Membresías
            </Link>
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
            className="text-xs text-blue-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
