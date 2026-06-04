'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { use } from 'react'

type PortalData = {
  membership: {
    user_name: string
    plan: string
    hours_total: number
    hours_used: number
    valid_until: string | null
    monto_mensual: number
    notas: string | null
  }
  payments: { monto: number; fecha: string; metodo: string; concepto: string | null }[]
  bookings: { start_time: string; end_time: string; status: string; rooms: { name: string } | null }[]
}

const SALA_COLORS: Record<string, string> = {
  'Alocasia': '#E67C73', 'Begonia': '#0B8043', 'Pothus 2': '#33B679',
  'Pandurata': '#7986CB', 'Peperomia': '#F6BF26', 'Calathea': '#3F51B5',
  'Pothus': '#F4511E', 'Bromelia': '#039BE5',
}

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-AR') }

function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtHora(s: string) {
  return new Date(s).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError('No se pudo cargar la información'); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">🌿</div>
          <p className="text-sm">Cargando tu portal...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a2332' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Link inválido o expirado</h1>
          <p className="text-blue-300 text-sm mb-6">
            Este link ya no es válido. Contactá a Oruga Cowork para obtener uno nuevo.
          </p>
          <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: '#25D366' }}>
            💬 Contactar por WhatsApp
          </a>
        </div>
      </div>
    )
  }

  const { membership: m, payments, bookings } = data
  const mesHoy = new Date().toISOString().slice(0, 7)
  const cobradoMes = payments.filter(p => p.fecha?.slice(0, 7) === mesHoy).reduce((a, p) => a + p.monto, 0)
  const saldoMes = Math.max(0, m.monto_mensual - cobradoMes)
  const horasRest = m.hours_total > 0 ? m.hours_total - m.hours_used : null
  const pctUsado  = m.hours_total > 0 ? Math.min(100, Math.round((m.hours_used / m.hours_total) * 100)) : null
  const salaColor = SALA_COLORS[m.plan] || '#1a2332'
  const salaFija  = !!SALA_COLORS[m.plan]
  const venceProx = m.valid_until
    ? Math.ceil((new Date(m.valid_until).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>
      {/* Header */}
      <div style={{ background: '#1a2332' }} className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-24 h-7">
            <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga Cowork" fill
              className="object-contain object-left brightness-0 invert" />
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#c5e84a', color: '#1a2332' }}>Portal</span>
        </div>
        <span className="text-xs text-blue-300">Vista privada · Solo vos podés ver esto</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Alerta horas bajas */}
        {pctUsado !== null && pctUsado >= 80 && (
          <div className="rounded-2xl px-4 py-3 flex items-start gap-3 border"
            style={{ background: pctUsado === 100 ? '#fef2f2' : '#fffbeb', borderColor: pctUsado === 100 ? '#fecaca' : '#fde68a' }}>
            <span className="text-xl">{pctUsado === 100 ? '🔴' : '⏳'}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: pctUsado === 100 ? '#dc2626' : '#b45309' }}>
                {pctUsado === 100 ? '¡Agotaste tus horas!' : `Quedan solo ${horasRest} horas (${100 - pctUsado}%)`}
              </p>
              <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer"
                className="text-xs underline mt-0.5 inline-block"
                style={{ color: pctUsado === 100 ? '#ef4444' : '#d97706' }}>
                Contactar a Oruga para renovar →
              </a>
            </div>
          </div>
        )}

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header con color de sala */}
          <div className="px-5 py-4" style={{ background: salaFija ? salaColor : '#1a2332' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70 text-white">
                  {salaFija ? 'Sala asignada' : 'Tu plan'}
                </p>
                <h1 className="text-2xl font-black text-white">{m.plan}</h1>
                <p className="text-white/70 text-sm mt-0.5">{m.user_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60 mb-1">Cuota mensual</p>
                <p className="text-xl font-black" style={{ color: '#c5e84a' }}>{fmt(m.monto_mensual)}</p>
              </div>
            </div>
            {m.valid_until && venceProx !== null && (
              <p className="text-xs text-white/60 mt-2">
                Vence: {new Date(m.valid_until).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {venceProx <= 7 && venceProx > 0 && <span className="ml-2 text-yellow-300 font-semibold">⚠ En {venceProx} días</span>}
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {/* Horas */}
            {m.hours_total > 0 && pctUsado !== null && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Horas del paquete</p>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>{m.hours_used} hs usadas</span>
                  <span className={horasRest === 0 ? 'text-red-500' : 'text-green-600'}>{horasRest} hs restantes</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div className="h-4 rounded-full transition-all flex items-center justify-end pr-2" style={{
                    width: `${pctUsado}%`,
                    background: pctUsado >= 100 ? '#ef4444' : pctUsado >= 80 ? '#f59e0b' : '#22c55e',
                    minWidth: pctUsado > 0 ? '2rem' : '0',
                  }}>
                    {pctUsado > 15 && <span className="text-white text-xs font-bold">{pctUsado}%</span>}
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>0 hs</span>
                  <span>{m.hours_total} hs total</span>
                </div>
              </div>
            )}

            {!m.hours_total && salaFija && (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2.5">
                  <span>✅</span>
                  <span className="font-semibold">Acceso ilimitado a tu sala asignada</span>
                </div>
              </div>
            )}

            {/* Estado de pago */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">
                Cuota de {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cuota mensual</span>
                  <span className="font-bold text-gray-800">{fmt(m.monto_mensual)}</span>
                </div>
                {cobradoMes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Abonado este mes</span>
                    <span className="font-bold text-green-600">{fmt(cobradoMes)}</span>
                  </div>
                )}
                {payments.filter(p => p.fecha?.slice(0, 7) === mesHoy).map((p, i) => (
                  <div key={i} className="text-xs text-gray-400 flex justify-between ml-4">
                    <span>{p.concepto || 'Pago'} · {new Date(p.fecha).toLocaleDateString('es-AR')} · {p.metodo}</span>
                    <span>{fmt(p.monto)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Saldo pendiente</span>
                  {saldoMes === 0
                    ? <span className="font-bold text-green-600">✅ Al día</span>
                    : <span className="font-bold text-red-500">{fmt(saldoMes)}</span>}
                </div>
              </div>

              {saldoMes > 0 && (
                <a href="https://wa.me/5493794899843?text=Hola!%20Quisiera%20coordinar%20el%20pago%20de%20mi%20cuota"
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                  style={{ background: '#25D366' }}>
                  💬 Coordinar pago
                </a>
              )}
            </div>

            {/* Próximas reservas */}
            {bookings.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Próximos turnos</p>
                <div className="space-y-2">
                  {bookings.map((b, i) => {
                    const rColor = SALA_COLORS[b.rooms?.name || ''] || '#64748b'
                    return (
                      <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl border"
                        style={{ borderColor: `${rColor}40`, background: `${rColor}0a` }}>
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: rColor }} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{b.rooms?.name || 'Sala'}</p>
                          <p className="text-xs text-gray-500">{fmtFecha(b.start_time)} · {fmtHora(b.start_time)} – {fmtHora(b.end_time)}</p>
                        </div>
                        {b.status === 'pending' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pendiente</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Notas */}
            {m.notas && (
              <div className="px-5 py-3">
                <p className="text-xs text-gray-400 italic">{m.notas}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: '#1a2332' }}>
          <div>
            <p className="text-white font-semibold text-sm">¿Necesitás algo?</p>
            <p className="text-blue-300 text-xs mt-0.5">Escribinos por WhatsApp o email</p>
          </div>
          <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#25D366' }}>
            WhatsApp
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          🔒 Esta es tu vista privada de Oruga Cowork · No compartir con terceros
        </p>
      </div>
    </div>
  )
}
