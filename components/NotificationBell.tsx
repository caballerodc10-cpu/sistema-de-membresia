'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Alerta = {
  id: string
  user_name: string
  telefono: string | null
  tipo: 'horas_bajas' | 'sin_horas' | 'pago_pendiente' | 'reserva_pendiente'
  detalle: string
  mensaje: string
  booking_id?: string
}

function buildMsg(nombre: string, tipo: Alerta['tipo'], detalle: string) {
  if (tipo === 'horas_bajas') return `Hola ${nombre}! Te avisamos desde Oruga que tu saldo de horas esta por agotarse. ${detalle}\n\nQueres recargar antes de que se te corte el acceso? Escribinos y lo resolvemos en 2 minutos.\n\n— Equipo Oruga Coworking`
  if (tipo === 'sin_horas') return `Hola ${nombre}! Queremos avisarte que tus horas en Oruga se agotaron. ${detalle}\n\nPara seguir usando el espacio, coordinemos la recarga.\n\n— Equipo Oruga Coworking`
  return `Hola ${nombre}! Te recordamos desde Oruga que tenes un saldo pendiente de pago. ${detalle}\n\nCuando puedas, coordinamos el pago. Estamos a disposicion!\n\n— Equipo Oruga Coworking`
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || '?'
}

const TIPO_CONFIG = {
  reserva_pendiente: { label: 'Reserva pendiente', color: '#3b82f6', bg: '#eff6ff', dot: '#3b82f6', icon: '🕐' },
  sin_horas: { label: 'Sin horas', color: '#dc2626', bg: '#fef2f2', dot: '#dc2626', icon: '🔴' },
  horas_bajas: { label: 'Horas bajas', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b', icon: '⚠️' },
  pago_pendiente: { label: 'Pago pendiente', color: '#ea580c', bg: '#fff7ed', dot: '#f97316', icon: '💳' },
}

const AVATAR_COLORS = [
  '#0a2744', '#0B8043', '#3F51B5', '#7986CB', '#039BE5', '#E67C73', '#F4511E', '#33B679',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(h)]
}

export default function NotificationBell({ isAdmin }: { isAdmin: boolean }) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAdmin) return
    loadAlertas()
  }, [isAdmin])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadAlertas() {
    setLoading(true)
    try {
      const supabase = createClient()
      const mesHoy = new Date().toISOString().slice(0, 7)

      const [{ data: mems, error: memsError }, { data: pendingBookings, error: bookingsError }] = await Promise.all([
        supabase.from('memberships').select('*'),
        supabase
          .from('bookings')
          .select('id, user_name, start_time, end_time, rooms(name)')
          .eq('status', 'pending')
          .order('start_time', { ascending: true }),
      ])

      if (memsError) console.error('memberships error:', memsError)
      if (bookingsError) console.error('bookings error:', bookingsError)

      const lista: Alerta[] = []

      for (const b of pendingBookings || []) {
        const roomName = (b.rooms as any)?.name || 'sala'
        const fecha = new Date(b.start_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
        const h1 = new Date(b.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        const h2 = new Date(b.end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        lista.push({
          id: b.id + '_rp',
          user_name: b.user_name || 'Cliente',
          telefono: null,
          tipo: 'reserva_pendiente',
          detalle: `${roomName} · ${fecha} de ${h1} a ${h2}`,
          mensaje: '',
          booking_id: b.id,
        })
      }

      for (const m of mems || []) {
        const horasRestantes = m.hours_total > 0 ? m.hours_total - m.hours_used : null

        if (horasRestantes !== null && horasRestantes <= 0) {
          const det = `Ya usaste todas las ${m.hours_total}hs de tu membresia ${m.plan}.`
          lista.push({
            id: m.id + '_sh',
            user_name: m.user_name || 'Cliente',
            telefono: m.telefono || null,
            tipo: 'sin_horas',
            detalle: det,
            mensaje: buildMsg(m.user_name || 'Cliente', 'sin_horas', det),
          })
        } else if (horasRestantes !== null && horasRestantes <= 3) {
          const det = `Te quedan solo ${horasRestantes}hs de tu membresia ${m.plan}.`
          lista.push({
            id: m.id + '_hb',
            user_name: m.user_name || 'Cliente',
            telefono: m.telefono || null,
            tipo: 'horas_bajas',
            detalle: det,
            mensaje: buildMsg(m.user_name || 'Cliente', 'horas_bajas', det),
          })
        }
      }

      setAlertas(lista)
    } catch (err) {
      console.error('NotificationBell error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function aprobarReserva(bookingId: string) {
    const supabase = createClient()
    const { data: booking } = await supabase
      .from('bookings').select('membership_id, start_time, end_time').eq('id', bookingId).single()
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
    if (booking?.membership_id) {
      const durHoras = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 3600000
      const { data: mem } = await supabase.from('memberships').select('hours_used').eq('id', booking.membership_id).single()
      if (mem) await supabase.from('memberships').update({ hours_used: mem.hours_used + durHoras }).eq('id', booking.membership_id)
    }
    loadAlertas()
  }

  async function rechazarReserva(bookingId: string) {
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    loadAlertas()
  }

  if (!isAdmin) return null

  const urgentes = alertas.filter(a => a.tipo === 'reserva_pendiente' || a.tipo === 'sin_horas')
  const resto = alertas.filter(a => a.tipo !== 'reserva_pendiente' && a.tipo !== 'sin_horas')

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl transition-all duration-200"
        style={{
          color: open ? '#c5e84a' : 'rgba(255,255,255,0.7)',
          background: open ? 'rgba(197,232,74,0.12)' : 'transparent',
          border: open ? '1px solid rgba(197,232,74,0.2)' : '1px solid transparent',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {alertas.length > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center"
            style={{ background: urgentes.length > 0 ? '#ef4444' : '#c5e84a', color: urgentes.length > 0 ? '#fff' : '#0a2744' }}
          >
            {alertas.length > 9 ? '9+' : alertas.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-12 z-50 overflow-hidden"
          style={{
            width: 380,
            maxHeight: '82vh',
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid #e8edf2',
            boxShadow: '0 8px 40px rgba(10,39,68,0.15), 0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'notif-in 0.18s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <style>{`
            @keyframes notif-in {
              from { opacity: 0; transform: scale(0.94) translateY(-8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ borderBottom: '1px solid #f0f4f8', background: '#fafbfc' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0a2744' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c5e84a" strokeWidth="2.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#0a2744' }}>Alertas</p>
                <p className="text-[10px] text-gray-400">{alertas.length} {alertas.length === 1 ? 'pendiente' : 'pendientes'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                Cargando alertas...
              </div>
            ) : alertas.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#f0fdf4', border: '2px solid #bbf7d0' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-700">Todo en orden</p>
                <p className="text-xs text-gray-400 mt-1">Sin alertas pendientes</p>
              </div>
            ) : (
              <div>
                {urgentes.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-red-400">
                      Requieren atencion
                    </p>
                    {urgentes.map(a => <AlertCard key={a.id} a={a} expanded={expanded} setExpanded={setExpanded} onAprobar={aprobarReserva} onRechazar={rechazarReserva} />)}
                  </div>
                )}
                {resto.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                      Otras alertas
                    </p>
                    {resto.map(a => <AlertCard key={a.id} a={a} expanded={expanded} setExpanded={setExpanded} onAprobar={aprobarReserva} onRechazar={rechazarReserva} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertCard({ a, expanded, setExpanded, onAprobar, onRechazar }: {
  a: Alerta
  expanded: string | null
  setExpanded: (id: string | null) => void
  onAprobar: (id: string) => void
  onRechazar: (id: string) => void
}) {
  const cfg = TIPO_CONFIG[a.tipo]
  const isExpanded = expanded === a.id
  const initials = getInitials(a.user_name)
  const bgColor = avatarColor(a.user_name)

  return (
    <div
      className="mx-3 mb-2 rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: `1.5px solid ${isExpanded ? cfg.color + '30' : '#f0f4f8'}`,
        background: isExpanded ? cfg.bg : '#fff',
        boxShadow: isExpanded ? `0 2px 12px ${cfg.color}15` : 'none',
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
        onClick={() => setExpanded(isExpanded ? null : a.id)}
      >
        <div
          className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-black text-white"
          style={{ background: bgColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-bold text-gray-900 truncate">{a.user_name}</p>
            <span
              className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25` }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{a.detalle}</p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          {a.tipo === 'reserva_pendiente' ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAprobar(a.booking_id!)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#16a34a' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                Aprobar reserva
              </button>
              <button
                onClick={() => onRechazar(a.booking_id!)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#dc2626' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                Rechazar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className="rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap"
                style={{ background: '#f8fafc', border: '1px solid #e8edf2', color: '#475569', maxHeight: 120, overflowY: 'auto' }}
              >
                {a.mensaje}
              </div>
              {a.telefono ? (
                <a
                  href={`https://wa.me/549${a.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(a.mensaje)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#25D366' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar por WhatsApp
                </a>
              ) : (
                <button
                  onClick={() => navigator.clipboard.writeText(a.mensaje)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold transition-colors"
                  style={{ background: '#f1f5f9', color: '#475569' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copiar mensaje
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
      }
