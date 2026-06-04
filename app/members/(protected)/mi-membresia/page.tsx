'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Membership = {
  id: string
  user_name: string
  plan: string
  hours_total: number
  hours_used: number
  valid_until: string | null
  monto_mensual: number
  notas: string | null
}

type Payment = {
  id: string
  monto: number
  fecha: string
  metodo: string
  concepto: string | null
}

type Booking = {
  id: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'pending' | 'cancelled'
  precio_total: number
  monto_pagado: number
  monto_sena: number
  medio_pago: string
  notes: string | null
  rooms: { name: string; capacity: number } | null
}

type Room = { id: string; name: string; capacity: number }

const SALA_COLORS: Record<string, string> = {
  'Alocasia': '#E67C73', 'Begonia': '#0B8043', 'Pothus 2': '#33B679',
  'Pandurata': '#7986CB', 'Peperomia': '#F6BF26', 'Calathea': '#3F51B5',
  'Pothus': '#F4511E', 'Bromelia': '#039BE5',
}

const SALA_FIJA_NAMES = Object.keys(SALA_COLORS)
const ES_FLEX = (plan: string) => !SALA_FIJA_NAMES.includes(plan)

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-AR') }
function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtHora(s: string) {
  return new Date(s).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmada',              color: '#15803d', bg: '#dcfce7' },
  pending:   { label: 'Pendiente de aprobación', color: '#92400e', bg: '#fef3c7' },
  cancelled: { label: 'Cancelada',               color: '#991b1b', bg: '#fee2e2' },
}

const MEDIO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago',
  tarjeta_debito: 'Débito', tarjeta_credito: 'Crédito', membresia: 'Membresía', link: 'Link de pago',
}

// ── Sub-componente tarjeta de reserva ─────────────────────────────────────────
function BookingCard({ b, past = false }: { b: Booking; past?: boolean }) {
  const salaColor = SALA_COLORS[b.rooms?.name || ''] || '#64748b'
  const statusInfo = STATUS_LABEL[b.status] || STATUS_LABEL.confirmed
  const pendiente = Math.max(0, (b.precio_total || 0) - (b.monto_pagado || 0))
  const tienePrecio = (b.precio_total || 0) > 0

  return (
    <div className={`rounded-xl border overflow-hidden ${past ? 'opacity-70' : ''}`}
      style={{ borderColor: past ? '#e5e7eb' : `${salaColor}55` }}>
      <div className="flex items-center gap-2.5 px-3 py-2.5"
        style={{ background: past ? '#f9fafb' : `${salaColor}18` }}>
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: salaColor }} />
        <p className="font-bold text-sm text-gray-800">{b.rooms?.name || 'Sala'}</p>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: statusInfo.bg, color: statusInfo.color }}>
          {statusInfo.label}
        </span>
      </div>
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📅</span>
          <span className="font-semibold text-gray-800">{fmtFecha(b.start_time)}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-600">{fmtHora(b.start_time)} – {fmtHora(b.end_time)}</span>
        </div>
        {tienePrecio && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs space-y-1.5">
            <div className="flex justify-between border-b border-gray-100 pb-1.5">
              <span className="font-semibold text-gray-500">Presupuesto</span>
              <span className="font-black text-gray-800">{fmt(b.precio_total)}</span>
            </div>
            {(b.monto_sena || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Seña entregada</span>
                <span className="font-medium text-amber-600">{fmt(b.monto_sena)}</span>
              </div>
            )}
            {(b.monto_pagado || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Total pagado</span>
                <span className="font-medium text-green-600">{fmt(b.monto_pagado)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-1.5">
              <span className="text-gray-400">Saldo pendiente</span>
              {pendiente === 0
                ? <span className="font-bold text-green-600">✅ Saldado</span>
                : <span className="font-bold text-red-500">{fmt(pendiente)}</span>}
            </div>
            {b.medio_pago && (
              <div className="flex justify-between">
                <span className="text-gray-400">Método de pago</span>
                <span className="text-gray-600">{MEDIO_LABEL[b.medio_pago] || b.medio_pago}</span>
              </div>
            )}
          </div>
        )}
        {!tienePrecio && b.medio_pago === 'membresia' && (
          <p className="text-xs text-blue-600 font-medium">✓ Incluido en tu membresía</p>
        )}
        {b.notes && <p className="text-xs text-gray-400 italic">{b.notes}</p>}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MiMembresiaPage() {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [payments, setPayments]     = useState<Payment[]>([])
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [rooms, setRooms]           = useState<Room[]>([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<'cuenta' | 'turnos'>('cuenta')

  const [showForm, setShowForm]     = useState(false)
  const [formData, setFormData]     = useState({
    room_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    desde: '09:00',
    hasta: '11:00',
    notas: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')
  const [formOk, setFormOk]         = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [membRes, bkRes] = await Promise.all([
      fetch('/api/members/my-membership'),
      fetch('/api/members/my-bookings'),
    ])
    const [membData, bkData] = await Promise.all([membRes.json(), bkRes.json()])
    const mem = membData.membership || null
    setMembership(mem)
    setPayments(membData.payments || [])
    setBookings(Array.isArray(bkData) ? bkData : [])

    // Solo cargar salas si el plan es flex (el usuario elige sala)
    if (mem && ES_FLEX(mem.plan)) {
      const res = await fetch('/api/rooms-public')
      const roomsData = await res.json()
      setRooms(Array.isArray(roomsData) ? roomsData : [])
    }
    setLoading(false)
  }

  async function handleSolicitud(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    const salaFija = membership ? !ES_FLEX(membership.plan) : false

    // Para sala fija: el servidor resuelve el room_id por el nombre del plan
    // Para flex: el usuario elige room_id desde el dropdown
    const body: Record<string, string | null> = {
      start_time: `${formData.fecha}T${formData.desde}:00`,
      end_time:   `${formData.fecha}T${formData.hasta}:00`,
      notes: formData.notas || null,
    }

    if (salaFija) {
      body.plan_name = membership!.plan   // el servidor busca el room_id
    } else {
      if (!formData.room_id) { setFormError('Seleccioná una sala'); setSubmitting(false); return }
      body.room_id = formData.room_id
    }

    const res = await fetch('/api/members/request-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result = await res.json()
    if (!res.ok) {
      setFormError(result.error || 'Error al enviar la solicitud')
    } else {
      setFormOk(true)
      setShowForm(false)
      setFormData({ room_id: '', fecha: new Date().toISOString().slice(0, 10), desde: '09:00', hasta: '11:00', notas: '' })
      await load()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center"><div className="text-3xl mb-2">🔄</div><p>Cargando...</p></div>
      </div>
    )
  }

  if (!membership) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-sm">
          <p className="text-4xl mb-3">🔍</p>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Sin membresía activa</h2>
          <p className="text-sm text-gray-500 mb-4">No encontramos una membresía asociada a tu cuenta.</p>
          <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#25D366' }}>
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    )
  }

  const m = membership
  const mesHoy = new Date().toISOString().slice(0, 7)
  const pagosMes     = payments.filter(p => p.fecha?.slice(0, 7) === mesHoy)
  const cobradoMes   = pagosMes.reduce((a, p) => a + p.monto, 0)
  const saldoMes     = Math.max(0, (m.monto_mensual || 0) - cobradoMes)
  const salaFija     = !ES_FLEX(m.plan)
  const salaColor    = SALA_COLORS[m.plan] || '#1a2332'
  const esFlex       = m.hours_total > 0
  const horasRest    = m.hours_total > 0 ? m.hours_total - m.hours_used : null
  const pctUsado     = m.hours_total > 0 ? Math.min(100, Math.round((m.hours_used / m.hours_total) * 100)) : null
  const horasBajas   = pctUsado !== null && pctUsado >= 80
  const venceProx    = m.valid_until ? Math.ceil((new Date(m.valid_until).getTime() - Date.now()) / 86400000) : null
  const ahora        = new Date().toISOString()
  const proximos     = bookings.filter(b => b.start_time >= ahora && b.status !== 'cancelled').slice(0, 6)
  const pasados      = bookings.filter(b => b.start_time < ahora || b.status === 'cancelled').slice(0, 10)

  // Duración del form para preview
  const durForm = (() => {
    if (!formData.desde || !formData.hasta) return 0
    const [h1, m1] = formData.desde.split(':').map(Number)
    const [h2, m2] = formData.hasta.split(':').map(Number)
    return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60)
  })()

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Alerta horas bajas */}
      {horasBajas && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3 border"
          style={{ background: pctUsado === 100 ? '#fef2f2' : '#fffbeb', borderColor: pctUsado === 100 ? '#fecaca' : '#fde68a' }}>
          <span className="text-xl">{pctUsado === 100 ? '🔴' : '⏳'}</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: pctUsado === 100 ? '#dc2626' : '#b45309' }}>
              {pctUsado === 100 ? '¡Agotaste tus horas!' : `Te quedan ${horasRest} hs (${100 - pctUsado!}% restante)`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Contactá a Oruga para recargar tu paquete de horas</p>
          </div>
        </div>
      )}

      {formOk && (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-green-50 border border-green-200">
          <span className="text-xl">✅</span>
          <p className="text-sm font-semibold text-green-800">Solicitud enviada. El equipo de Oruga te confirmará el turno.</p>
          <button onClick={() => setFormOk(false)} className="ml-auto text-green-500 text-lg leading-none">×</button>
        </div>
      )}

      {/* Card principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header con color de sala */}
        <div className="px-5 py-4" style={{ background: salaFija ? salaColor : '#1a2332' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: salaFija ? 'rgba(255,255,255,0.75)' : '#c5e84a' }}>
                {salaFija ? 'Tu sala asignada' : 'Plan de horas'}
              </p>
              <h2 className="text-2xl font-black text-white">{m.plan}</h2>
              <p className="text-white/70 text-sm mt-0.5">{m.user_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60 mb-1">Cuota mensual</p>
              <p className="text-xl font-black" style={{ color: salaFija ? 'rgba(255,255,255,0.95)' : '#c5e84a' }}>
                {fmt(m.monto_mensual)}
              </p>
            </div>
          </div>
          {salaFija && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-white/75 text-xs">
              {rooms.find(r => r.name === m.plan) && (
                <span>🏢 Hasta {rooms.find(r => r.name === m.plan)?.capacity} personas</span>
              )}
              {m.notas && <span>· {m.notas}</span>}
              {m.valid_until && (
                <span>· Vence: {new Date(m.valid_until).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          )}
          {esFlex && (
            <div className="mt-3 text-xs text-blue-200">
              📦 Paquete de {m.hours_total}hs · Usaste {m.hours_used}hs · Disponibles: <strong className="text-white">{horasRest}hs</strong>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { id: 'cuenta', label: '📋 Mi cuenta' },
            { id: 'turnos', label: `📅 Mis turnos${bookings.length > 0 ? ` (${bookings.length})` : ''}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t.id ? 'border-b-2 text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
              style={tab === t.id ? { borderColor: '#1a2332' } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB CUENTA ─── */}
        {tab === 'cuenta' && (
          <div className="divide-y divide-gray-50">

            {/* Horas (solo si tiene paquete) */}
            {esFlex && pctUsado !== null && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Horas de tu paquete</p>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>{m.hours_used} hs usadas</span>
                  <span>{horasRest} hs restantes</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all" style={{
                    width: `${pctUsado}%`,
                    background: pctUsado >= 100 ? '#ef4444' : pctUsado >= 80 ? '#f59e0b' : '#22c55e',
                  }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-gray-400">{pctUsado}% utilizado</span>
                  {horasRest !== null && horasRest > 0 && (
                    <span className="text-xs font-bold text-green-600">{horasRest} hs disponibles para reservar</span>
                  )}
                </div>
              </div>
            )}

            {/* Sin límite de horas */}
            {!esFlex && salaFija && (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2.5">
                  <span>✅</span>
                  <span className="font-semibold">Acceso ilimitado a tu sala asignada</span>
                </div>
              </div>
            )}

            {/* Estado de pago de cuota */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">
                Cuota de {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Presupuesto mensual</span>
                  <span className="font-bold text-gray-800">{fmt(m.monto_mensual)}</span>
                </div>

                {pagosMes.map(p => (
                  <div key={p.id} className="bg-green-50 rounded-xl px-3 py-2 text-xs space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-700">{fmt(p.monto)} abonado</span>
                      <span className="text-green-600">{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>{p.concepto || 'Pago cuota'}</span>
                      <span>{p.metodo}</span>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between text-sm border-t border-gray-100 pt-2.5">
                  <span className="text-gray-500">Saldo pendiente</span>
                  {saldoMes === 0
                    ? <span className="font-bold text-green-600">✅ Al día</span>
                    : <span className="font-bold text-red-500">{fmt(saldoMes)}</span>}
                </div>
              </div>
              {saldoMes > 0 && (
                <a href="https://wa.me/5493794899843?text=Hola!%20Quiero%20coordinar%20el%20pago%20de%20mi%20membresía"
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                  style={{ background: '#25D366' }}>
                  💬 Coordinar pago
                </a>
              )}
            </div>

            {/* Vencimiento si está por vencer */}
            {m.valid_until && venceProx !== null && venceProx <= 14 && (
              <div className="px-5 py-3">
                <div className={`flex items-center justify-between text-sm rounded-xl px-3 py-2.5 border ${venceProx <= 0 ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                  <span className="text-gray-700">Vencimiento: <strong>{new Date(m.valid_until).toLocaleDateString('es-AR')}</strong></span>
                  {venceProx > 0
                    ? <span className="text-xs font-bold text-orange-600">En {venceProx} días</span>
                    : <span className="text-xs font-bold text-red-600">Vencida</span>}
                </div>
              </div>
            )}

            {/* Historial de pagos de cuota */}
            {payments.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Historial de pagos de cuota</p>
                <div className="space-y-2">
                  {payments.map(p => {
                    const esMes = p.fecha?.slice(0, 7) === mesHoy
                    return (
                      <div key={p.id} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${esMes ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{esMes ? '✅' : '💳'}</span>
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#1a2332' }}>{fmt(p.monto)}</p>
                            <p className="text-xs text-gray-400">{p.concepto || 'Pago cuota'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{new Date(p.fecha).toLocaleDateString('es-AR')}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-100 text-gray-500">{p.metodo}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB TURNOS ─── */}
        {tab === 'turnos' && (
          <div className="divide-y divide-gray-50">

            {/* Solicitar turno (miembros con horas o sala fija) */}
            <div className="px-5 py-4">
              {!showForm ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Solicitar un turno</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {esFlex
                        ? `Tenés ${horasRest} hs disponibles · Oruga confirmará tu solicitud`
                        : 'Reservá un horario en tu sala asignada'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    disabled={esFlex && (horasRest !== null && horasRest <= 0)}
                    className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: '#1a2332' }}
                  >
                    + Solicitar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSolicitud} className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-800">Nueva solicitud de turno</p>
                    <button type="button" onClick={() => { setShowForm(false); setFormError('') }}
                      className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>

                  {/* Sala */}
                  {salaFija ? (
                    <div className="flex items-center gap-2.5 text-sm py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: salaColor }} />
                      <span className="font-semibold text-gray-800">{m.plan}</span>
                      <span className="text-gray-400 text-xs">— tu sala asignada</span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Sala</label>
                      <select value={formData.room_id} required
                        onChange={e => setFormData(d => ({ ...d, room_id: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800">
                        <option value="">— Elegí una sala —</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>{r.name} · hasta {r.capacity} personas</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                    <input type="date" required
                      min={new Date().toISOString().slice(0, 10)}
                      value={formData.fecha}
                      onChange={e => setFormData(d => ({ ...d, fecha: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Desde', key: 'desde' },
                      { label: 'Hasta', key: 'hasta' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                        <input type="time" required min="07:00" max="21:00"
                          value={formData[key as 'desde' | 'hasta']}
                          onChange={e => setFormData(d => ({ ...d, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Preview duración + horas restantes */}
                  {durForm > 0 && formData.hasta > formData.desde && (
                    <div className={`rounded-xl px-3 py-2.5 text-xs flex items-center justify-between border ${esFlex && horasRest !== null && (horasRest - durForm) < 0 ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                      <span className="text-gray-600">Duración: <strong>{durForm}hs</strong></span>
                      {esFlex && horasRest !== null && (
                        <span className={`font-semibold ${(horasRest - durForm) < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                          {(horasRest - durForm) < 0
                            ? '⚠ No tenés suficientes horas'
                            : `Te quedarían ${horasRest - durForm}hs`}
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notas (opcional)</label>
                    <input type="text"
                      value={formData.notas}
                      onChange={e => setFormData(d => ({ ...d, notas: e.target.value }))}
                      placeholder="Ej: viene con 3 personas, necesita proyector..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800"
                    />
                  </div>

                  {formError && (
                    <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{formError}</div>
                  )}

                  <button type="submit" disabled={submitting}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: '#1a2332' }}>
                    {submitting ? 'Enviando...' : 'Enviar solicitud de turno'}
                  </button>
                  <p className="text-xs text-center text-gray-400">El equipo de Oruga confirmará y te avisará</p>
                </form>
              )}
            </div>

            {/* Próximos turnos */}
            {proximos.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Próximos turnos</p>
                <div className="space-y-3">
                  {proximos.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}

            {/* Historial */}
            {pasados.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Historial de turnos</p>
                <div className="space-y-3">
                  {pasados.map(b => <BookingCard key={b.id} b={b} past />)}
                </div>
              </div>
            )}

            {bookings.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-gray-500 text-sm">No tenés turnos registrados.</p>
                <p className="text-gray-400 text-xs mt-1">Usá el botón de arriba para solicitar tu primer turno</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA WhatsApp */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: '#1a2332' }}>
        <div>
          <p className="text-white font-semibold text-sm">¿Necesitás ayuda?</p>
          <p className="text-blue-300 text-xs mt-0.5">Escribinos por WhatsApp</p>
        </div>
        <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#25D366' }}>
          WhatsApp
        </a>
      </div>
    </div>
  )
}
