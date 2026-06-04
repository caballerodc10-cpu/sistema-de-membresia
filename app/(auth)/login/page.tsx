'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

const SALAS = [
  { nombre: 'Alocasia', color: '#E67C73', hs: 'Reuniones ejecutivas' },
  { nombre: 'Calathea', color: '#3F51B5', hs: 'Salas de trabajo' },
  { nombre: 'Bromelia', color: '#039BE5', hs: 'Coworking abierto' },
  { nombre: 'Pandurata', color: '#7986CB', hs: 'Taller & formación' },
  { nombre: 'Begonia', color: '#0B8043', hs: 'Entrevistas' },
  { nombre: 'Peperomia', color: '#F6BF26', hs: 'Sala flex' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/home')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Panel izquierdo: hero ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between px-12 py-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a2744 0%, #0d3560 60%, #0a2744 100%)' }}
      >
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, #c5e84a 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c5e84a 0%, transparent 50%)',
          }} />

        {/* Logo */}
        <div>
          <div className="relative w-40 h-12">
            <Image
              src="/logo/logo-oruga-sin-fondo.png"
              alt="Oruga Cowork"
              fill
              className="object-contain object-left brightness-0 invert"
            />
          </div>
        </div>

        {/* Hero copy */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#c5e84a' }}>
              Corrientes · Argentina
            </p>
            <h1 className="text-4xl font-black text-white leading-tight">
              El espacio donde{' '}
              <span style={{ color: '#c5e84a' }}>trabajan</span>
              <br />las ideas.
            </h1>
            <p className="text-blue-300 mt-4 text-lg leading-relaxed">
              Reservá salas, gestioná membresías y trabajá en un entorno diseñado para que tu negocio crezca.
            </p>
          </div>

          {/* Salas */}
          <div>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-3">Nuestros espacios</p>
            <div className="grid grid-cols-2 gap-2">
              {SALAS.map(s => (
                <div key={s.nombre} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{s.nombre}</p>
                    <p className="text-blue-400 text-xs">{s.hs}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-2 border-t border-white/10">
            {[
              { v: '8', l: 'Salas privadas' },
              { v: '24/7', l: 'Acceso miembros' },
              { v: '100%', l: 'Online' },
            ].map(s => (
              <div key={s.l}>
                <p className="text-2xl font-black" style={{ color: '#c5e84a' }}>{s.v}</p>
                <p className="text-blue-400 text-xs mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer hero */}
        <div className="flex items-center gap-3">
          <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            +54 9 379 489-9843
          </a>
          <span className="text-white/20">·</span>
          <a href="https://oruga.netlify.app" target="_blank" rel="noopener noreferrer"
            className="text-sm text-blue-300 hover:text-white transition-colors">
            oruga.netlify.app
          </a>
        </div>
      </div>

      {/* ── Panel derecho: formulario ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: '#f8fafc' }}>

        {/* Logo mobile */}
        <div className="lg:hidden mb-8 text-center">
          <div className="relative w-40 h-12 mx-auto mb-2">
            <Image
              src="/logo/logo-oruga-sin-fondo.png"
              alt="Oruga Cowork"
              fill
              className="object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(12%) sepia(50%) saturate(800%) hue-rotate(188deg)' }}
            />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#0a2744' }}>El espacio donde trabajan las ideas</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black" style={{ color: '#0a2744' }}>Bienvenido</h2>
            <p className="text-gray-500 mt-1 text-sm">Ingresá para gestionar tus reservas y membresía</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white shadow-sm text-sm"
                style={{ '--tw-ring-color': '#0a2744' } as React.CSSProperties}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white shadow-sm text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded-xl transition-opacity disabled:opacity-60 hover:opacity-90 text-sm mt-2"
              style={{ background: '#0a2744', color: '#c5e84a' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar al sistema'}
            </button>
          </form>

          {/* Accesos rápidos */}
          <div className="mt-6 space-y-2">
            <p className="text-xs text-gray-400 text-center font-medium">Accesos directos</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/members/login"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-blue-200 hover:text-blue-700 transition-colors shadow-sm"
              >
                <span>👥</span> Portal Members
              </Link>
              <a
                href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20reservar%20una%20sala"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-green-300 hover:text-green-700 transition-colors shadow-sm"
              >
                <span>💬</span> WhatsApp
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: '#0a2744' }}>
              Registrarse
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-gray-300 mt-8">
            © {new Date().getFullYear()} Oruga Cowork · Corrientes
          </p>
        </div>
      </div>
    </div>
  )
}
