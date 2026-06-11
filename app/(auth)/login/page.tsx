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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [resetError, setResetError] = useState('')

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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')
    setResetMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setResetError('No se pudo enviar el email. Verificá la dirección.')
    } else {
      setResetMsg('Listo! Revisá tu email para restablecer la contraseña.')
    }
    setResetLoading(false)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">

      {/* ── Fondo: foto real del espacio ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-oruga.png"
          alt="Oruga Cowork"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay oscuro degradado */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(7,26,46,0.88) 0%, rgba(7,26,46,0.72) 50%, rgba(7,26,46,0.82) 100%)' }}
        />
      </div>

      {/* ── Modal reset contraseña ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative">
            <button
              onClick={() => { setShowResetModal(false); setResetMsg(''); setResetError(''); setResetEmail('') }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-black" style={{ color: '#0a2744' }}>Restablecer contraseña</h3>
              <p className="text-gray-500 text-sm mt-1">Te enviamos un link a tu email para crear una nueva contraseña.</p>
            </div>
            {resetMsg ? (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-green-700 text-sm text-center font-medium">{resetMsg}</div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required placeholder="tu@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white shadow-sm text-sm" />
                </div>
                {resetError && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">{resetError}</div>}
                <button type="submit" disabled={resetLoading}
                  className="login-btn w-full font-bold py-3 rounded-xl text-sm disabled:opacity-60"
                  style={{ color: '#0a2744' }}>
                  {resetLoading ? 'Enviando...' : 'Enviar link de reseteo'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .login-btn {
          background: linear-gradient(270deg, #c5e84a, #7dd35a, #4ade80, #a3e635, #c5e84a);
          background-size: 300% 300%;
          animation: aurora-shift 4s ease infinite;
          box-shadow: 0 0 0 1px rgba(197,232,74,.4), 0 4px 20px rgba(197,232,74,.3);
          transition: box-shadow .2s ease, transform .1s ease;
        }
        .login-btn:hover:not(:disabled) {
          box-shadow: 0 0 0 1px rgba(197,232,74,.6), 0 6px 28px rgba(197,232,74,.45);
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        @keyframes aurora-shift {
          0%   { background-position: 0% 50% }
          50%  { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        .glass-input {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          color: #fff;
          transition: border-color 0.2s, background 0.2s;
        }
        .glass-input::placeholder { color: rgba(255,255,255,0.35); }
        .glass-input:focus {
          outline: none;
          background: rgba(255,255,255,0.13);
          border-color: rgba(197,232,74,0.6);
        }
      `}</style>

      {/* ── Contenido principal — dos columnas en desktop ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Columna izquierda — hero text */}
        <div className="flex-1 text-center lg:text-left">
          {/* Logo */}
          <div className="relative w-36 h-11 mx-auto lg:mx-0 mb-6">
            <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga" fill className="object-contain object-center lg:object-left brightness-0 invert" />
          </div>

          {/* Tag */}
          <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: '#c5e84a', letterSpacing: '0.18em' }}>
            Coworking · Corrientes Capital
          </p>

          {/* Headline */}
          <h1 className="font-black text-white leading-[1.08] mb-5"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontStyle: 'italic' }}>
            El espacio donde<br />
            <span style={{ color: '#c5e84a' }}>trabajan</span> las ideas.
          </h1>

          {/* Subtitulo */}
          <p className="text-blue-200 leading-relaxed max-w-sm mx-auto lg:mx-0"
            style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}>
            Salas, oficinas, talleres y comunidad emprendedora en Buenos Aires 678, Corrientes.
          </p>

          {/* Botones CTA — solo desktop */}
          <div className="hidden lg:flex gap-3 mt-8">
            <a href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20reservar%20una%20sala"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: '#25D366', color: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <Link href="/members/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', background: 'rgba(255,255,255,0.08)' }}>
              👥 Portal Members
            </Link>
          </div>
        </div>

        {/* Columna derecha — formulario de login */}
        <div className="w-full lg:w-auto lg:min-w-[360px]">
          <div
            className="rounded-2xl p-7 sm:p-8"
            style={{
              background: 'rgba(7,26,46,0.75)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Bienvenido</h2>
              <p className="text-blue-300 mt-1 text-sm">Ingresá para gestionar tus reservas y membresía</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="tu@email.com" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-blue-200">Contraseña</label>
                  <button type="button" onClick={() => setShowResetModal(true)}
                    className="text-xs font-medium transition-colors hover:text-white"
                    style={{ color: '#c5e84a' }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    className="glass-input w-full px-4 py-3 pr-11 rounded-xl text-sm"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    tabIndex={-1}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="login-btn w-full font-bold py-3 rounded-xl text-sm mt-2 disabled:opacity-60"
                style={{ color: '#0a2744' }}>
                {loading ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>
            </form>

            {/* Accesos directos */}
            <div className="mt-5 space-y-2">
              <p className="text-xs text-center font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Accesos directos</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/members/login"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                  <span>👥</span> Portal Members
                </Link>
                <a href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20reservar%20una%20sala"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#4ade80' }}>
                  <span>💬</span> WhatsApp
                </a>
              </div>
            </div>

            <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              ¿No tenés cuenta?{' '}
              <Link href="/register" className="font-semibold hover:text-white transition-colors" style={{ color: '#c5e84a' }}>Registrarse</Link>
            </p>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} Oruga Cowork · Corrientes
          </p>
        </div>
      </div>
    </div>
  )
}
