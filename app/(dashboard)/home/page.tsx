'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const ROOM_COLORS: Record<string, string> = {
  'Alocasia': '#E67C73',
  'Begonia': '#0B8043',
  'Pothus 2': '#33B679',
  'Pandurata': '#7986CB',
  'Peperomia': '#F6BF26',
  'Calathea': '#3F51B5',
  'Pothus': '#F4511E',
  'Bromelia': '#039BE5',
}

type SalaStatus = {
  id: string
  name: string
  capacity: number
  ocupadaHasta: string | null
  proximaReserva: string | null
}

export default function HomePage() {
  const [salas, setSalas] = useState<SalaStatus[]>([])
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hora, setHora] = useState('')

  useEffect(() => {
    const tick = () => setHora(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const meRes = await fetch('/api/me')
    const me = await meRes.json()
    setUserName(me?.name || '')
    setIsAdmin(me?.role === 'admin')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: rooms } = await supabase
      .from('rooms').select('id, name, capacity').order('name')

    const ahora = new Date().toISOString()
    const hoy = new Date().toISOString().split('T')[0]
  const esFinDeSemana = hoy.getDay() === 0 || hoy.getDay() === 6

    const { data: bookings } = await supabase
      .from('bookings')
      .select('room_id, start_time, end_time, user_name')
      .eq('status', 'confirmed')
      .gte('end_time', ahora)
      .lte('start_time', `${hoy}T23:59:59`)

    const salasStatus: SalaStatus[] = (rooms || []).map(r => {
      const reservasDeHoy = (bookings || []).filter(b => b.room_id === r.id)
      const ocupadaAhora = reservasDeHoy.find(b => b.start_time <= ahora && b.end_time >= ahora)
      const proxima = reservasDeHoy
        .filter(b => b.start_time > ahora)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

      return {
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        ocupadaHasta: ocupadaAhora ? ocupadaAhora.end_time : null,
        proximaReserva: proxima ? proxima.start_time : null,
      }
    })

    setSalas(salasStatus)
    setLoading(false)
  }

  const disponibles = salas.filter(s => !s.ocupadaHasta)
  const ocupadas = salas.filter(s => s.ocupadaHasta)

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const hoy = new Date()
  const fechaHoy = `${diasSemana[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]}`

  function formatHora(iso: string) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Hero con fotos reales */}
      <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 220, background: '#0a2744' }}>
        <div className="absolute inset-0">
          <Image src="/hero-oruga.png" alt="Oruga Coworking" fill className="object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,39,68,0.7) 0%, rgba(10,39,68,0.3) 100%)' }} />
        <div className="relative z-10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ minHeight: 220 }}>
          <div className="flex flex-col justify-center">
            <div className="relative w-36 h-14 mb-3">
              <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga" fill className="object-contain object-left brightness-0 invert" />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: '#c5e84a' }}>{fechaHoy}</p>
            <h1 className="text-2xl font-bold text-white">
              {userName ? `Hola, ${userName.split(' ')[0]}` : 'Bienvenido'}
            </h1>
            <p className="text-blue-200 text-sm mt-1">Buenos Aires 678 · Corrientes Capital</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-5xl font-bold text-white tabular-nums">{hora}</p>
            <p className="text-blue-200 text-xs mt-1">hora local</p>
          </div>
        </div>
      </div>

      
      {/* Banner fin de semana para clientes */}
      {!isAdmin && esFinDeSemana && (
        <a
          href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20consultar%20disponibilidad%20para%20reservar%20una%20sala%20este%20fin%20de%20semana"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl p-4 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0a2744, #1a3d6e)', border: '1.5px solid rgba(197,232,74,0.3)' }}
        >
          <div>
            <p className="text-white font-bold text-sm">&#x1F4C5; Reservas de fin de semana</p>
            <p className="text-blue-200 text-xs mt-0.5">Los sabados y domingos consulta disponibilidad por WhatsApp</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shrink-0" style={{ background: '#25D366', color: '#fff' }}>
            WhatsApp
          </div>
        </a>
      )}

      {/* Disponibilidad ahora */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: '#0a2744' }}>
            Disponibilidad ahora
          </h2>
          <Link href="/calendar" className="text-sm font-medium hover:underline" style={{ color: '#0a2744' }}>
            Ver calendario &#x2192;
          </Link>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center text-gray-400">Cargando...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {salas.map(sala => {
              const libre = !sala.ocupadaHasta
              const color = ROOM_COLORS[sala.name] || '#616161'
              return (
                <div key={sala.id}
                  className="rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${libre ? '#bbf7d0' : '#fecaca'}`,
                    boxShadow: libre
                      ? '0 2px 12px rgba(16,185,129,0.08), 0 1px 3px rgba(0,0,0,0.04)'
                      : '0 2px 12px rgba(239,68,68,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{
                        background: libre ? '#dcfce7' : '#fee2e2',
                        color: libre ? '#15803d' : '#dc2626',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'currentColor' }} />
                      {libre ? 'Libre' : 'Ocupada'}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{sala.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span>&#x1F465;</span> hasta {sala.capacity} personas
                  </p>
                  {!libre && sala.ocupadaHasta && (
                    <p className="text-xs font-medium" style={{ color: '#dc2626' }}>Libera {formatHora(sala.ocupadaHasta)}</p>
                  )}
                  {libre && sala.proximaReserva && (
                    <p className="text-xs font-medium text-amber-500">Ocupada desde {formatHora(sala.proximaReserva)}</p>
                  )}
                  {libre && !sala.proximaReserva && (
                    <p className="text-xs font-medium text-emerald-600">Todo el día libre</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen rapido */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '1.5px solid #bbf7d0',
              boxShadow: '0 2px 12px rgba(16,185,129,0.1)',
            }}
          >
            <p className="text-4xl font-black" style={{ color: '#15803d' }}>{disponibles.length}</p>
            <p className="text-sm font-medium mt-1" style={{ color: '#166534' }}>salas disponibles</p>
          </div>
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
              border: '1.5px solid #fecaca',
              boxShadow: '0 2px 12px rgba(239,68,68,0.08)',
            }}
          >
            <p className="text-4xl font-black" style={{ color: '#dc2626' }}>{ocupadas.length}</p>
            <p className="text-sm font-medium mt-1" style={{ color: '#991b1b' }}>salas ocupadas</p>
          </div>
        </div>
      )}

      {/* Accesos rapidos */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: '#0a2744' }}>Accesos rapidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/calendar', label: 'Calendario', icon: '&#x1F4C5;', desc: 'Ver todas las reservas', accent: '#3b82f6' },
            { href: '/salas', label: 'Nuestras salas', icon: '&#x1F3E2;', desc: 'Fotos y disponibilidad', accent: '#8b5cf6' },
            { href: '/bookings', label: 'Mis reservas', icon: '&#x1F4CB;', desc: 'Historial y proximas', accent: '#f59e0b' },
            isAdmin
              ? { href: '/admin/finances', label: 'Finanzas', icon: '&#x1F4B0;', desc: 'Ingresos y egresos', accent: '#10b981' }
              : { href: '/membership', label: 'Membresía', icon: '&#x1F48E;', desc: 'Tu plan actual', accent: '#f59e0b' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="group bg-white rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: '1.5px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = item.accent + '40'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${item.accent}18` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: item.accent + '15' }}
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
              <p className="font-bold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Panel Admin - solo visible para admins */}
      {isAdmin && (
        <div className="rounded-2xl overflow-hidden border-2 shadow-sm" style={{ borderColor: '#c5e84a' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#0a2744' }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#c5e84a', color: '#0a2744' }}>&#x1F6E0; ADMIN</span>
            <p className="text-white font-semibold text-sm">Panel de administracion</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 bg-white divide-x divide-gray-100">
            {[
              { href: '/admin/dashboard', label: 'Dashboard', icon: '&#x1F4CA;' },
              { href: '/admin/memberships', label: 'Membresías', icon: '&#x1F48E;' },
              { href: '/admin/finances', label: 'Finanzas', icon: '&#x1F4B0;' },
              { href: '/admin/users', label: 'Usuarios', icon: '&#x1F465;' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center justify-center gap-1 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-xl" dangerouslySetInnerHTML={{ __html: item.icon }} />
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA WhatsApp para clientes */}
      {!isAdmin && (
        <a href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20consultar%20disponibilidad%20para%20reservar%20una%20sala"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl p-4 transition-opacity hover:opacity-90"
          style={{ background: '#0a2744' }}>
          <div>
            <p className="text-white font-semibold">Queres reservar?</p>
            <p className="text-blue-200 text-sm">Escribinos por WhatsApp</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
            style={{ background: '#25D366', color: '#fff' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </div>
        </a>
      )}
    </div>
  )
              }
