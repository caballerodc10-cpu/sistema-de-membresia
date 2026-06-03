'use client'

import { useEffect, useState } from 'react'

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

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

export default function MiMembresiaPage() {
  const [data, setData] = useState<{ membership: Membership | null; payments: Payment[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/members/my-membership')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2">🔄</div>
          <p>Cargando tu membresía...</p>
        </div>
      </div>
    )
  }

  if (!data?.membership) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm">
          <p className="text-4xl mb-3">🔍</p>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Sin membresía activa</h2>
          <p className="text-sm text-gray-500 mb-4">
            No encontramos una membresía asociada a tu cuenta. Contactanos para vincularte.
          </p>
          <a
            href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20consultar%20sobre%20mi%20membresía"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#25D366' }}
          >
            WhatsApp
          </a>
        </div>
      </div>
    )
  }

  const m = data.membership
  const payments = data.payments

  const mesHoy = new Date().toISOString().slice(0, 7)
  const pagosMes = payments.filter(p => p.fecha?.slice(0, 7) === mesHoy)
  const cobradoMes = pagosMes.reduce((a, p) => a + p.monto, 0)
  const saldoMes = Math.max(0, (m.monto_mensual || 0) - cobradoMes)

  const horasRestantes = m.hours_total > 0 ? m.hours_total - m.hours_used : null
  const pctUsado = m.hours_total > 0 ? Math.min(100, Math.round((m.hours_used / m.hours_total) * 100)) : null
  const horasBajas = pctUsado !== null && pctUsado >= 80

  const venceProx = m.valid_until ? (() => {
    const hoy = new Date()
    const vence = new Date(m.valid_until!)
    const diff = Math.ceil((vence.getTime() - hoy.getTime()) / 86400000)
    return diff
  })() : null

  return (
    <div className="space-y-5 max-w-xl mx-auto">

      {/* Alerta horas bajas */}
      {horasBajas && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3 border"
          style={{ background: pctUsado === 100 ? '#fef2f2' : '#fffbeb', borderColor: pctUsado === 100 ? '#fecaca' : '#fde68a' }}>
          <span className="text-xl">{pctUsado === 100 ? '🔴' : '⏳'}</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: pctUsado === 100 ? '#dc2626' : '#b45309' }}>
              {pctUsado === 100 ? '¡Agotaste tus horas!' : '¡Tus horas están por agotarse!'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: pctUsado === 100 ? '#ef4444' : '#d97706' }}>
              {pctUsado === 100
                ? 'Ya no podés usar el espacio. Contactanos para recargar.'
                : `Te quedan ${horasRestantes} horas disponibles (${100 - pctUsado!}%).`}
            </p>
          </div>
        </div>
      )}

      {/* Card plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4" style={{ background: '#1a2332' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#c5e84a' }}>TU PLAN</p>
              <h2 className="text-2xl font-bold text-white">{m.plan}</h2>
              <p className="text-blue-200 text-sm mt-0.5">{m.user_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-300 mb-1">Cuota mensual</p>
              <p className="text-xl font-bold" style={{ color: '#c5e84a' }}>{fmt(m.monto_mensual)}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Horas */}
          {m.hours_total > 0 && pctUsado !== null && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Horas de acceso</span>
                <span className="text-gray-500">{m.hours_used} / {m.hours_total} hs</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${pctUsado}%`,
                    background: pctUsado >= 100 ? '#ef4444' : pctUsado >= 80 ? '#f59e0b' : '#22c55e',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">{pctUsado}% usado</span>
                {horasRestantes !== null && horasRestantes > 0 && (
                  <span className="text-xs font-semibold text-green-600">{horasRestantes} hs restantes</span>
                )}
                {horasRestantes !== null && horasRestantes <= 0 && (
                  <span className="text-xs font-semibold text-red-500">Sin horas disponibles</span>
                )}
              </div>
            </div>
          )}

          {m.hours_total === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2">
              <span>✅</span>
              <span className="font-medium">Acceso ilimitado al espacio</span>
            </div>
          )}

          {/* Estado de pago */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Estado de pago — {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</p>
              {saldoMes === 0 && cobradoMes > 0 ? (
                <p className="font-semibold text-green-600 text-sm">✅ Al día — Pagado {fmt(cobradoMes)}</p>
              ) : saldoMes > 0 ? (
                <p className="font-semibold text-red-500 text-sm">⚠️ Pendiente {fmt(saldoMes)}</p>
              ) : (
                <p className="text-sm text-gray-400">Sin registro de pago este mes</p>
              )}
            </div>
            {saldoMes > 0 && (
              <a
                href="https://wa.me/5493794899843?text=Hola!%20Quiero%20coordinar%20el%20pago%20de%20mi%20membresía"
                target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                style={{ background: '#1a2332' }}
              >
                Coordinar pago
              </a>
            )}
          </div>

          {/* Vencimiento */}
          {m.valid_until && (
            <div className={`flex items-center justify-between text-sm rounded-xl px-3 py-2.5 ${
              venceProx !== null && venceProx <= 7
                ? 'bg-orange-50 border border-orange-100'
                : 'bg-gray-50'
            }`}>
              <span className="text-gray-600">
                Vencimiento: <strong>{new Date(m.valid_until).toLocaleDateString('es-AR')}</strong>
              </span>
              {venceProx !== null && venceProx <= 7 && venceProx > 0 && (
                <span className="text-xs font-semibold text-orange-600">Vence en {venceProx} días</span>
              )}
              {venceProx !== null && venceProx <= 0 && (
                <span className="text-xs font-semibold text-red-500">Vencida</span>
              )}
            </div>
          )}

          {/* Notas */}
          {m.notas && (
            <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2">{m.notas}</p>
          )}
        </div>
      </div>

      {/* Historial de pagos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4">Historial de pagos</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay pagos registrados.</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => {
              const esMesActual = p.fecha?.slice(0, 7) === mesHoy
              return (
                <div key={p.id}
                  className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl ${esMesActual ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{esMesActual ? '✅' : '💳'}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1a2332' }}>{fmt(p.monto)}</p>
                      <p className="text-xs text-gray-400">{p.concepto || 'Pago de membresía'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(p.fecha).toLocaleDateString('es-AR')}</p>
                    <p className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-100 text-gray-500 inline-block mt-0.5">
                      {p.metodo}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA contacto */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
        style={{ background: '#1a2332' }}>
        <div>
          <p className="text-white font-semibold text-sm">¿Necesitás ayuda?</p>
          <p className="text-blue-300 text-xs mt-0.5">Contactanos por WhatsApp o email</p>
        </div>
        <a
          href="https://wa.me/5493794899843"
          target="_blank" rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#25D366' }}
        >
          WhatsApp
        </a>
      </div>
    </div>
  )
}
