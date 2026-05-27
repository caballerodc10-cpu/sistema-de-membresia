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
  if (tipo === 'horas_bajas') return `¡Hola ${nombre}! 👋 Te avisamos desde Oruga que tu saldo de horas está por agotarse. ${detalle}\n\n¿Querés recargar antes de que se te corte el acceso? Escribinos y lo resolvemos en 2 minutos. 🚀\n\n— Equipo Oruga Coworking`
  if (tipo === 'sin_horas') return `¡Hola ${nombre}! 👋 Queremos avisarte que tus horas en Oruga se agotaron. ${detalle}\n\nPara seguir usando el espacio, coordinemos la recarga. ¡Nos encargamos rápido! 🚀\n\n— Equipo Oruga Coworking`
  return `¡Hola ${nombre}! 👋 Te recordamos desde Oruga que tenés un saldo pendiente de pago. ${detalle}\n\nCuando puedas, coordinamos el pago. ¡Estamos a disposición! 💪\n\n— Equipo Oruga Coworking`
}

export default function NotificationBell({ isAdmin }: { isAdmin: boolean }) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
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
    const supabase = createClient()
    const mesHoy = new Date().toISOString().slice(0, 7)

    const [{ data: mems }, { data: pays }, { data: pendingBookings }] = await Promise.all([
      supabase.from('memberships').select('*'),
      supabase.from('payments')
        .select('membership_id, monto')
        .gte('fecha', mesHoy + '-01')
        .lte('fecha', mesHoy + '-31'),
      supabase.from('bookings')
        .select('id, user_name, start_time, end_time, rooms(name)')
        .eq('status', 'pending')
        .order('start_time', { ascending: true }),
    ])

    const cobradoPor: Record<string, number> = {}
    for (const p of pays || []) {
      cobradoPor[p.membership_id] = (cobradoPor[p.membership_id] || 0) + p.monto
    }

    const lista: Alerta[] = []

    // Reservas pendientes de aprobación (primero, más urgentes)
    for (const b of pendingBookings || []) {
      const roomName = (b.rooms as any)?.name || 'sala'
      const fecha = new Date(b.start_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
      const h1 = new Date(b.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      const h2 = new Date(b.end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      const det = `${roomName} · ${fecha} de ${h1} a ${h2}`
      lista.push({
        id: b.id + '_rp',
        user_name: b.user_name || 'Cliente',
        telefono: null,
        tipo: 'reserva_pendiente',
        detalle: det,
        mensaje: '',
        booking_id: b.id,
      })
    }

    for (const m of mems || []) {
      const horasRestantes = m.hours_total > 0 ? m.hours_total - m.hours_used : null
      const pct = m.hours_total > 0 ? (m.hours_used / m.hours_total) : null
      const cobrado = cobradoPor[m.id] || 0
      const saldo = Math.max(0, (m.monto_mensual || 0) - cobrado)

      if (horasRestantes !== null && horasRestantes <= 0) {
        const det = `Ya usaste todas las ${m.hours_total} horas de tu membresía ${m.plan}.`
        lista.push({ id: m.id + '_sh', user_name: m.user_name, telefono: m.telefono, tipo: 'sin_horas', detalle: det, mensaje: buildMsg(m.user_name, 'sin_horas', det) })
      } else if (horasRestantes !== null && horasRestantes <= 3) {
        const det = `Te quedan solo ${horasRestantes}hs de tu membresía ${m.plan}.`
        lista.push({ id: m.id + '_hb', user_name: m.user_name, telefono: m.telefono, tipo: 'horas_bajas', detalle: det, mensaje: buildMsg(m.user_name, 'horas_bajas', det) })
      }

      if (saldo > 0 && m.monto_mensual > 0) {
        const det = `Tenés $${Math.round(saldo).toLocaleString('es-AR')} pendientes de tu membresía ${m.plan}.`
        lista.push({ id: m.id + '_pp', user_name: m.user_name, telefono: m.telefono, tipo: 'pago_pendiente', detalle: det, mensaje: buildMsg(m.user_name, 'pago_pendiente', det) })
      }
    }

    setAlertas(lista)
    setLoading(false)
  }

  async function aprobarReserva(bookingId: string) {
    const supabase = createClient()
    // Fetch the booking to get membership_id and duration
    const { data: booking } = await supabase
      .from('bookings')
      .select('membership_id, start_time, end_time')
      .eq('id', bookingId)
      .single()

    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)

    // Deduct hours from membership if applicable
    if (booking?.membership_id) {
      const durHoras = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 3600000
      const { data: mem } = await supabase
        .from('memberships')
        .select('hours_used')
        .eq('id', booking.membership_id)
        .single()
      if (mem) {
        await supabase.from('memberships')
          .update({ hours_used: mem.hours_used + durHoras })
          .eq('id', booking.membership_id)
      }
    }

    loadAlertas()
  }

  async function rechazarReserva(bookingId: string) {
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    loadAlertas()
  }

  if (!isAdmin) return null

  const iconoTipo = { horas_bajas: '⏳', sin_horas: '🔴', pago_pendiente: '💰', reserva_pendiente: '🕐' }
  const labelTipo = { horas_bajas: 'Horas bajas', sin_horas: 'Sin horas', pago_pendiente: 'Pago pendiente', reserva_pendiente: 'Reserva pendiente' }
  const colorTipo = { horas_bajas: 'bg-amber-100 text-amber-700', sin_horas: 'bg-red-100 text-red-600', pago_pendiente: 'bg-orange-100 text-orange-600', reserva_pendiente: 'bg-blue-100 text-blue-700' }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-blue-200 hover:bg-white/10 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {alertas.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: '#c5e84a', color: '#0a2744', fontSize: 10 }}>
            {alertas.length > 9 ? '9+' : alertas.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-800">Alertas</p>
            <span className="text-xs text-gray-400">{alertas.length} pendientes</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
          ) : alertas.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <p className="text-2xl mb-2">✅</p>
              <p>Todo en orden, sin alertas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alertas.map(a => (
                <div key={a.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorTipo[a.tipo]}`}>
                      {iconoTipo[a.tipo]} {labelTipo[a.tipo]}
                    </span>
                    <p className="font-semibold text-gray-800 text-sm">{a.user_name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{a.detalle}</p>

                  {/* Mensaje preview */}
                  {a.tipo !== 'reserva_pendiente' && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed border border-gray-100">
                      {a.mensaje}
                    </div>
                  )}

                  {a.tipo === 'reserva_pendiente' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => aprobarReserva(a.booking_id!)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: '#0B8043' }}>
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => rechazarReserva(a.booking_id!)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600">
                        ✖ Rechazar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {a.telefono ? (
                        <a
                          href={`https://wa.me/549${a.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(a.mensaje)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: '#25D366' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Enviar WhatsApp
                        </a>
                      ) : (
                        <button
                          onClick={() => navigator.clipboard.writeText(a.mensaje)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
                          📋 Copiar mensaje
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
