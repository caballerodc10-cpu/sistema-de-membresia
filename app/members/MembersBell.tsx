'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Alerta = {
  id: string
  user_name: string
  tipo: 'horas_bajas' | 'sin_horas' | 'pago_pendiente' | 'vence_pronto'
  detalle: string
}

export default function MembersBell({ isAdmin }: { isAdmin: boolean }) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const mesHoy = new Date().toISOString().slice(0, 7)
    const hoy = new Date()
    const en7dias = new Date(hoy)
    en7dias.setDate(hoy.getDate() + 7)

    const [{ data: mems }, { data: pays }] = await Promise.all([
      supabase.from('memberships').select('*'),
      supabase.from('payments')
        .select('membership_id, monto')
        .gte('fecha', mesHoy + '-01')
        .lte('fecha', mesHoy + '-31'),
    ])

    const cobradoPor: Record<string, number> = {}
    for (const p of pays || []) {
      cobradoPor[p.membership_id] = (cobradoPor[p.membership_id] || 0) + p.monto
    }

    const lista: Alerta[] = []

    for (const m of mems || []) {
      const horasRestantes = m.hours_total > 0 ? m.hours_total - m.hours_used : null
      const pctUsado = m.hours_total > 0 ? m.hours_used / m.hours_total : null
      const cobrado = cobradoPor[m.id] || 0
      const saldo = Math.max(0, (m.monto_mensual || 0) - cobrado)

      // Horas: menos del 20% restante
      if (pctUsado !== null && pctUsado >= 0.8) {
        const restantes = m.hours_total - m.hours_used
        lista.push({
          id: m.id + '_h',
          user_name: m.user_name,
          tipo: restantes <= 0 ? 'sin_horas' : 'horas_bajas',
          detalle: restantes <= 0
            ? `Agotó sus ${m.hours_total}hs del plan ${m.plan}`
            : `Le quedan ${restantes}hs de ${m.hours_total}hs (${m.plan})`,
        })
      }

      // Pago pendiente
      if (saldo > 0 && m.monto_mensual > 0) {
        lista.push({
          id: m.id + '_p',
          user_name: m.user_name,
          tipo: 'pago_pendiente',
          detalle: `Debe $${Math.round(saldo).toLocaleString('es-AR')} · ${m.plan}`,
        })
      }

      // Vence en menos de 7 días
      if (m.valid_until) {
        const vence = new Date(m.valid_until)
        if (vence >= hoy && vence <= en7dias) {
          lista.push({
            id: m.id + '_v',
            user_name: m.user_name,
            tipo: 'vence_pronto',
            detalle: `Vence el ${vence.toLocaleDateString('es-AR')} · ${m.plan}`,
          })
        }
      }
    }

    setAlertas(lista)
    setLoading(false)
  }

  if (!isAdmin) return null

  const iconoTipo = { horas_bajas: '⏳', sin_horas: '🔴', pago_pendiente: '💰', vence_pronto: '📅' }
  const colorTipo = {
    horas_bajas: 'bg-amber-100 text-amber-700',
    sin_horas: 'bg-red-100 text-red-600',
    pago_pendiente: 'bg-orange-100 text-orange-600',
    vence_pronto: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-blue-300 hover:bg-white/10 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {alertas.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: '#c5e84a', color: '#1a2332', fontSize: 10 }}>
            {alertas.length > 9 ? '9+' : alertas.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-h-[75vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-800 text-sm">Alertas de membresías</p>
            <span className="text-xs text-gray-400">{alertas.length} alertas</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
          ) : alertas.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <p className="text-2xl mb-1">✅</p>
              <p>Sin alertas activas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alertas.map(a => (
                <div key={a.id} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorTipo[a.tipo]}`}>
                      {iconoTipo[a.tipo]}
                    </span>
                    <p className="font-semibold text-gray-800 text-sm">{a.user_name}</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">{a.detalle}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
