'use client'

import { useEffect, useRef, useState } from 'react'

type Alerta = {
  id: string
  user_name: string
  plan: string
  telefono: string | null
  tipo: 'horas_bajas' | 'sin_horas' | 'pago_pendiente' | 'vence_pronto' | 'nuevo_registro'
  detalle: string
  hours_total?: number
  hours_used?: number
  monto_pendiente?: number
}

function buildWAMessage(a: Alerta): string {
  const nombre = a.user_name.split(' ')[0] // primer nombre / empresa abreviada
  switch (a.tipo) {
    case 'horas_bajas': {
      const rest = (a.hours_total ?? 0) - (a.hours_used ?? 0)
      return `Hola ${nombre}! 👋 Te quedan *${rest} horas* disponibles de tu membresía en Oruga Cowork. Cuando quieras podemos renovar tu paquete para que no te quedes sin espacio. ¡Seguimos? 🌿`
    }
    case 'sin_horas':
      return `Hola ${nombre}! 👋 Agotaste las horas de tu membresía en Oruga Cowork. Para seguir disfrutando del espacio, coordinamos la renovación de tu paquete. ¿Cómo seguimos? 🌿`
    case 'pago_pendiente': {
      const monto = a.monto_pendiente ? `$${Math.round(a.monto_pendiente).toLocaleString('es-AR')}` : 'la cuota pendiente'
      return `Hola ${nombre}! 👋 Te recordamos que tenés un saldo pendiente de *${monto}* por tu membresía en Oruga Cowork. Cuando puedas coordinamos el pago. ¡Gracias! 🌿`
    }
    case 'vence_pronto':
      return `Hola ${nombre}! 👋 Tu membresía en Oruga Cowork está próxima a vencer. ¿La renovamos? ¡Te esperamos! 🌿`
    case 'nuevo_registro':
      return `Hola! 👋 Gracias por registrarte en Oruga Cowork. Revisamos tu información y te habilitamos el acceso enseguida. ¡Bienvenido/a! 🌿`
    default:
      return `Hola ${nombre}! Te contactamos desde Oruga Cowork. 🌿`
  }
}

function buildWALink(telefono: string | null, mensaje: string): string | null {
  if (!telefono) return null
  const tel = '549' + telefono.replace(/\D/g, '')
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
}

export default function MembersBell({ isAdmin }: { isAdmin: boolean }) {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/members/alerts')
      .then(r => r.json())
      .then(data => { setAlertas(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isAdmin])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function copyMsg(id: string, msg: string) {
    try {
      await navigator.clipboard.writeText(msg)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* fallback */ }
  }

  if (!isAdmin) return null

  const iconoTipo: Record<string, string> = {
    horas_bajas: '⏳', sin_horas: '🔴', pago_pendiente: '💰', vence_pronto: '📅', nuevo_registro: '🆕'
  }
  const colorTipo: Record<string, string> = {
    horas_bajas:     'bg-amber-100 text-amber-800',
    sin_horas:       'bg-red-100 text-red-700',
    pago_pendiente:  'bg-orange-100 text-orange-700',
    vence_pronto:    'bg-blue-100 text-blue-700',
    nuevo_registro:  'bg-purple-100 text-purple-700',
  }
  const tituloTipo: Record<string, string> = {
    horas_bajas:    'Pocas horas',
    sin_horas:      'Sin horas',
    pago_pendiente: 'Pago pendiente',
    vence_pronto:   'Vence pronto',
    nuevo_registro: 'Nuevo registro',
  }

  const sinHoras    = alertas.filter(a => a.tipo === 'sin_horas').length
  const horasBajas  = alertas.filter(a => a.tipo === 'horas_bajas').length
  const pagos       = alertas.filter(a => a.tipo === 'pago_pendiente').length
  const vencen      = alertas.filter(a => a.tipo === 'vence_pronto').length
  const nuevos      = alertas.filter(a => a.tipo === 'nuevo_registro').length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-blue-300 hover:bg-white/10 transition-colors"
        title={`${alertas.length} alertas`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {alertas.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-xs font-black flex items-center justify-center"
            style={{ background: '#c5e84a', color: '#1a2332', fontSize: 10 }}>
            {alertas.length > 9 ? '9+' : alertas.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-96 max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-800 text-sm">Alertas de membresías</p>
              <span className="text-xs text-gray-400">{alertas.length} alertas</span>
            </div>
            {/* Mini resumen */}
            {alertas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {nuevos     > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">🆕 {nuevos} nuevo{nuevos > 1 ? 's' : ''}</span>}
                {sinHoras   > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">🔴 {sinHoras} sin horas</span>}
                {horasBajas > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⏳ {horasBajas} pocas hs</span>}
                {pagos      > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">💰 {pagos} deben</span>}
                {vencen     > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">📅 {vencen} vencen</span>}
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando alertas...</div>
          ) : alertas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-sm text-gray-500 font-medium">Todo en orden</p>
              <p className="text-xs text-gray-400 mt-1">Sin alertas activas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alertas.map(a => {
                const msg = buildWAMessage(a)
                const waLink = buildWALink(a.telefono, msg)
                const isCopied = copied === a.id

                return (
                  <div key={a.id} className="p-3 hover:bg-gray-50/50">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorTipo[a.tipo]}`}>
                          {iconoTipo[a.tipo]} {tituloTipo[a.tipo]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copiar mensaje */}
                        <button
                          onClick={() => copyMsg(a.id, msg)}
                          title="Copiar mensaje"
                          className={`text-xs px-2 py-1 rounded-lg transition-colors font-medium ${isCopied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {isCopied ? '✓ Copiado' : '📋'}
                        </button>
                        {/* Para nuevo registro → link a crear membresía */}
                        {a.tipo === 'nuevo_registro' && (
                          <a href="/members/admin"
                            className="text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium transition-colors">
                            + Membresía
                          </a>
                        )}
                        {/* Abrir WhatsApp */}
                        {a.tipo !== 'nuevo_registro' && waLink && (
                          <a href={waLink} target="_blank" rel="noopener noreferrer"
                            title="Enviar por WhatsApp"
                            className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors">
                            WA
                          </a>
                        )}
                        {a.tipo !== 'nuevo_registro' && !waLink && (
                          <span className="text-xs text-gray-300 px-2">sin tel</span>
                        )}
                      </div>
                    </div>

                    <p className="font-semibold text-gray-800 text-sm">{a.user_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.detalle}</p>

                    {/* Preview del mensaje */}
                    <div className="mt-2 bg-green-50 rounded-lg px-2.5 py-2 text-xs text-gray-600 leading-relaxed border border-green-100">
                      {msg}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
