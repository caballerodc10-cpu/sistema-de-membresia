'use client'

import { useEffect, useState } from 'react'

type Member = {
  id: string
  user_id: string | null
  user_name: string
  plan: string
  hours_total: number
  hours_used: number
  valid_until: string | null
  monto_mensual: number
  notas: string | null
  telefono?: string | null
}

type Payment = {
  id: string
  membership_id: string
  user_name: string
  monto: number
  fecha: string
  metodo: string
  concepto: string | null
  notas: string | null
}

const METODOS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta']
const PLANES  = ['Alocasia','Begonia','Pothus 2','Peperomia','Calathea','Pothus','Bromelia','Pandurata','Flex','Flex Compartido','Visitante','Residente','Full']

const SALA_COLORS: Record<string, string> = {
  'Alocasia':'#E67C73','Begonia':'#0B8043','Pothus 2':'#33B679',
  'Pandurata':'#7986CB','Peperomia':'#F6BF26','Calathea':'#3F51B5',
  'Pothus':'#F4511E','Bromelia':'#039BE5',
}

function mesLabel(mes: string) {
  const [y, m] = mes.split('-')
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${meses[parseInt(m) - 1]} ${y}`
}

function prevMes(mes: string) {
  const d = new Date(mes + '-01')
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 7)
}

function nextMes(mes: string) {
  const d = new Date(mes + '-01')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 7)
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

export default function MembersAdminPage() {
  const mesHoy = new Date().toISOString().slice(0, 7)
  const [mes, setMes] = useState(mesHoy)
  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // UI state
  const [registrandoId, setRegistrandoId] = useState<string | null>(null)
  const [historialId, setHistorialId] = useState<string | null>(null)
  const [vincularId, setVincularId] = useState<string | null>(null)
  const [vincularEmail, setVincularEmail] = useState('')
  const [vincularMsg, setVincularMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroSala, setFiltroSala] = useState('')
  const [filtroComprobante, setFiltroComprobante] = useState('')
  const [showNuevo, setShowNuevo] = useState(false)

  const [formNuevo, setFormNuevo] = useState({
    user_name: '',
    plan: 'Alocasia',
    hours_total: '',
    monto_mensual: '',
    valid_until: (() => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10)
    })(),
    telefono: '',
    notas: '',
  })

  const [formPago, setFormPago] = useState({
    monto: '',
    fecha: new Date().toISOString().slice(0, 10),
    metodo: 'Efectivo',
    concepto: '',
    comprobante: '',   // Factura A / Factura B / Factura C / Recibo X / Sin comprobante
    notas: '',
  })

  useEffect(() => { load() }, [mes])

  async function load() {
    setLoading(true)
    const [memsRes, paysRes] = await Promise.all([
      fetch('/api/admin/memberships'),
      fetch(`/api/admin/payments?mes=${mes}`),
    ])
    const [mems, pays] = await Promise.all([memsRes.json(), paysRes.json()])
    setMembers(Array.isArray(mems) ? mems : [])
    setPayments(Array.isArray(pays) ? pays : [])
    setLoading(false)
  }

  function cobradoMes(membId: string) {
    return payments.filter(p => p.membership_id === membId).reduce((a, p) => a + p.monto, 0)
  }

  function saldo(m: Member) {
    return Math.max(0, (m.monto_mensual || 0) - cobradoMes(m.id))
  }

  function pagosDeMember(membId: string) {
    return payments.filter(p => p.membership_id === membId)
  }

  async function registrarPago(m: Member) {
    if (!formPago.monto || Number(formPago.monto) <= 0) return
    setSaving(true)
    const notaFinal = [
      formPago.comprobante ? `Comprobante: ${formPago.comprobante}` : '',
      formPago.notas,
    ].filter(Boolean).join(' · ') || null

    await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        membership_id: m.id,
        user_id: m.user_id,
        user_name: m.user_name,
        monto: Number(formPago.monto),
        fecha: formPago.fecha,
        metodo: formPago.metodo,
        concepto: formPago.concepto || `Cuota ${mesLabel(mes)}`,
        notas: notaFinal,
      }),
    })
    setRegistrandoId(null)
    setFormPago({ monto: '', fecha: new Date().toISOString().slice(0, 10), metodo: 'Efectivo', concepto: '', comprobante: '', notas: '' })
    await load()
    setSaving(false)
  }

  async function vincularCuenta(membId: string) {
    if (!vincularEmail.trim()) return
    setSaving(true)
    setVincularMsg('')
    const res = await fetch('/api/members/link-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membership_id: membId, email: vincularEmail.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setVincularMsg('✅ Cuenta vinculada correctamente')
      setVincularEmail('')
      await load()
    } else {
      setVincularMsg('❌ ' + (data.error || 'Error al vincular'))
    }
    setSaving(false)
  }

  async function desvincularCuenta(membId: string) {
    if (!confirm('¿Desvincular la cuenta de esta membresía?')) return
    await fetch('/api/members/link-account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membership_id: membId }),
    })
    await load()
  }

  async function eliminarPago(pagoId: string) {
    if (!confirm('¿Eliminar este pago?')) return
    await fetch(`/api/admin/payments/${pagoId}`, { method: 'DELETE' })
    await load()
  }

  async function crearMembresia() {
    if (!formNuevo.user_name.trim() || !formNuevo.monto_mensual) return
    setSaving(true)
    await fetch('/api/admin/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: null,
        user_name: formNuevo.user_name.trim(),
        plan: formNuevo.plan,
        hours_total: Number(formNuevo.hours_total) || 0,
        hours_used: 0,
        monto_mensual: Number(formNuevo.monto_mensual),
        valid_until: formNuevo.valid_until || null,
        telefono: formNuevo.telefono || null,
        notas: formNuevo.notas || null,
      }),
    })
    setShowNuevo(false)
    setFormNuevo({
      user_name: '', plan: 'Alocasia', hours_total: '', monto_mensual: '',
      valid_until: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10) })(),
      telefono: '', notas: '',
    })
    await load()
    setSaving(false)
  }

  // Métricas
  const totalMensual = members.reduce((a, m) => a + (m.monto_mensual || 0), 0)
  const totalCobrado = members.reduce((a, m) => a + cobradoMes(m.id), 0)
  const totalPendiente = members.reduce((a, m) => a + saldo(m), 0)
  const alDia = members.filter(m => saldo(m) === 0 && m.monto_mensual > 0 && cobradoMes(m.id) > 0).length
  const conDeuda = members.filter(m => saldo(m) > 0).length

  // Filtros
  const membersFiltrados = members.filter(m => {
    const matchSearch = !searchTerm ||
      m.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.plan.toLowerCase().includes(searchTerm.toLowerCase())
    const matchSala = !filtroSala || m.plan === filtroSala
    const matchComprobante = !filtroComprobante || pagosDeMember(m.id).some(p =>
      (p.notas || '').includes(`Comprobante: ${filtroComprobante}`)
    )
    return matchSearch && matchSala && matchComprobante
  })

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a2332' }}>Membresías</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} miembros activos</p>
        </div>
        <button
          onClick={() => setShowNuevo(v => !v)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#1a2332' }}
        >
          {showNuevo ? '✕ Cancelar' : '+ Nueva membresía'}
        </button>
      </div>

      {/* Form nueva membresía */}
      {showNuevo && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Alta de membresía</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del cliente / empresa *</label>
              <input type="text" value={formNuevo.user_name}
                onChange={e => setFormNuevo(d => ({ ...d, user_name: e.target.value }))}
                placeholder="Ej: AWA Consulting, Club Robótica Corrientes..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Plan / Sala *</label>
              <select value={formNuevo.plan}
                onChange={e => setFormNuevo(d => ({ ...d, plan: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800">
                {PLANES.map(p => <option key={p}>{p}</option>)}
              </select>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: SALA_COLORS[formNuevo.plan] || '#94a3b8' }} />
                <span className="text-xs text-gray-400">
                  {SALA_COLORS[formNuevo.plan] ? 'Sala fija asignada' : 'Acceso flexible'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Horas contratadas (0 = sin límite)</label>
              <input type="number" min="0" value={formNuevo.hours_total}
                onChange={e => setFormNuevo(d => ({ ...d, hours_total: e.target.value }))}
                placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">Para planes Flex: ingresá las horas del paquete (Ej: 10, 20, 40)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Monto mensual ($) *</label>
              <input type="number" min="0" value={formNuevo.monto_mensual}
                onChange={e => setFormNuevo(d => ({ ...d, monto_mensual: e.target.value }))}
                placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de vencimiento</label>
              <input type="date" value={formNuevo.valid_until}
                onChange={e => setFormNuevo(d => ({ ...d, valid_until: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono WhatsApp (sin 0, sin 15)</label>
              <input type="text" value={formNuevo.telefono}
                onChange={e => setFormNuevo(d => ({ ...d, telefono: e.target.value }))}
                placeholder="Ej: 3794123456"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Notas internas</label>
              <input type="text" value={formNuevo.notas}
                onChange={e => setFormNuevo(d => ({ ...d, notas: e.target.value }))}
                placeholder="Ej: 2 días por semana, acuerdo trimestral, viene los martes..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={crearMembresia}
              disabled={saving || !formNuevo.user_name.trim() || !formNuevo.monto_mensual}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: '#1a2332' }}
            >
              {saving ? 'Guardando...' : 'Crear membresía'}
            </button>
            <button onClick={() => setShowNuevo(false)}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-600 bg-gray-100 font-medium">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Selector de mes */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMes(prevMes(mes))}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
        >‹</button>
        <span className="font-semibold text-gray-800 min-w-36 text-center text-sm">{mesLabel(mes)}</span>
        <button
          onClick={() => setMes(nextMes(mes))}
          disabled={mes >= mesHoy}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm disabled:opacity-30"
        >›</button>
        {mes !== mesHoy && (
          <button onClick={() => setMes(mesHoy)} className="text-xs text-blue-500 hover:underline">Hoy</button>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Facturación', value: fmt(totalMensual), sub: 'Total mensual', color: '#1a2332' },
          { label: 'Cobrado', value: fmt(totalCobrado), sub: mesLabel(mes), color: '#16a34a' },
          { label: 'Pendiente', value: fmt(totalPendiente), sub: 'Por cobrar', color: '#dc2626' },
          { label: 'Estado', value: `${alDia} / ${conDeuda}`, sub: 'Al día / Con deuda', color: '#d97706' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar miembro..." className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none shadow-sm" />
        </div>
        <select value={filtroSala} onChange={e => setFiltroSala(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none shadow-sm">
          <option value="">Todas las salas</option>
          {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filtroComprobante} onChange={e => setFiltroComprobante(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none shadow-sm">
          <option value="">Todos los comprobantes</option>
          {['Factura A','Factura B','Factura C','Recibo X','Sin comprobante'].map(c => <option key={c}>{c}</option>)}
        </select>
        {(searchTerm || filtroSala || filtroComprobante) && (
          <button onClick={() => { setSearchTerm(''); setFiltroSala(''); setFiltroComprobante('') }}
            className="text-xs px-3 py-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista de miembros */}
      {loading ? (
        <div className="h-40 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : membersFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
          {(searchTerm || filtroSala || filtroComprobante) ? 'Sin resultados para los filtros aplicados.' : 'No hay membresías registradas.'}
        </div>
      ) : (
        <div className="space-y-3">
          {membersFiltrados.map(m => {
            const cobrado = cobradoMes(m.id)
            const debe = saldo(m)
            const pagos = pagosDeMember(m.id)
            const isRegistrando = registrandoId === m.id
            const isHistorial = historialId === m.id

            const horasRestantes = m.hours_total > 0 ? m.hours_total - m.hours_used : null
            const pctUsado = m.hours_total > 0 ? Math.min(100, Math.round((m.hours_used / m.hours_total) * 100)) : null
            const barColor = pctUsado !== null
              ? pctUsado >= 100 ? '#ef4444' : pctUsado >= 80 ? '#f59e0b' : '#22c55e'
              : null

            // Días hasta vencimiento
            const diasVence = m.valid_until ? Math.ceil((new Date(m.valid_until).getTime() - Date.now()) / 86400000) : null

            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl border shadow-sm transition-shadow ${
                  debe > 0 ? 'border-red-100' : 'border-gray-100'
                }`}
              >
                <div className="p-4">
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="font-bold text-gray-900 text-base">{m.user_name || '—'}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                          style={{ background: SALA_COLORS[m.plan] || '#64748b' }}>
                          {m.plan}
                        </span>
                        {debe > 0 ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                            Debe {fmt(debe)}
                          </span>
                        ) : cobrado > 0 ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Al día</span>
                        ) : null}
                        {diasVence !== null && diasVence <= 7 && diasVence > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                            Vence en {diasVence}d
                          </span>
                        )}
                        {diasVence !== null && diasVence <= 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Vencida</span>
                        )}
                      </div>

                      {/* Barra de horas */}
                      {m.hours_total > 0 && pctUsado !== null && barColor && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{m.hours_used} / {m.hours_total} hs usadas</span>
                            {horasRestantes !== null && (
                              <span style={{ color: barColor }}>
                                {horasRestantes > 0 ? `Restan ${horasRestantes} hs` : 'Sin horas'}
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pctUsado}%`, background: barColor }} />
                          </div>
                        </div>
                      )}

                      {/* Info financiera */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-gray-500">Cuota: <strong className="text-gray-800">{fmt(m.monto_mensual)}</strong></span>
                        <span className="text-gray-500">Cobrado: <strong className="text-green-600">{fmt(cobrado)}</strong></span>
                        {debe > 0 && <span className="text-gray-500">Pendiente: <strong className="text-red-500">{fmt(debe)}</strong></span>}
                        {m.valid_until && (
                          <span className="text-gray-400 text-xs">Vence: {new Date(m.valid_until).toLocaleDateString('es-AR')}</span>
                        )}
                      </div>

                      {m.notas && (
                        <p className="text-xs text-gray-400 italic mt-1">{m.notas}</p>
                      )}

                      {/* Pagos compactos del mes */}
                      {pagos.length > 0 && !isHistorial && (
                        <div className="mt-2 space-y-0.5">
                          {pagos.slice(0, 2).map(p => (
                            <div key={p.id} className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="text-green-600 font-semibold">{fmt(p.monto)}</span>
                              <span>·</span>
                              <span>{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                              <span>·</span>
                              <span>{p.metodo}</span>
                              {p.concepto && <><span>·</span><span className="text-gray-400">{p.concepto}</span></>}
                            </div>
                          ))}
                          {pagos.length > 2 && (
                            <button onClick={() => setHistorialId(m.id)} className="text-xs text-blue-500 hover:underline">
                              Ver {pagos.length - 2} más...
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones — SIN editar/eliminar membresía */}
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setRegistrandoId(isRegistrando ? null : m.id)
                          setFormPago(f => ({ ...f, monto: String(debe || m.monto_mensual) }))
                          setHistorialId(null)
                          setVincularId(null)
                        }}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: '#0B8043' }}
                      >
                        {isRegistrando ? 'Cancelar' : '+ Pago'}
                      </button>
                      <button
                        onClick={() => {
                          setHistorialId(isHistorial ? null : m.id)
                          setRegistrandoId(null)
                          setVincularId(null)
                        }}
                        className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200"
                      >
                        Historial {pagos.length > 0 ? `(${pagos.length})` : ''}
                      </button>
                      {/* Vincular cuenta */}
                      {!m.user_id ? (
                        <button
                          onClick={() => { setVincularId(vincularId === m.id ? null : m.id); setVincularMsg(''); setVincularEmail(''); setRegistrandoId(null); setHistorialId(null) }}
                          className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
                          title="Vincular a cuenta de usuario"
                        >
                          🔗 Vincular
                        </button>
                      ) : (
                        <button
                          onClick={() => desvincularCuenta(m.id)}
                          className="text-xs px-3 py-1.5 rounded-xl bg-green-50 text-green-600 font-medium hover:bg-green-100"
                          title="Cuenta vinculada — clic para desvincular"
                        >
                          ✅ Vinculada
                        </button>
                      )}
                      {m.telefono && (
                        <a
                          href={`https://wa.me/549${m.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(m.user_name)}!%20Te%20contactamos%20desde%20Oruga%20Cowork%20sobre%20tu%20membresía.`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white flex items-center gap-1"
                          style={{ background: '#25D366' }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Panel vincular cuenta */}
                  {vincularId === m.id && (
                    <div className="mt-4 pt-4 border-t border-blue-100 bg-blue-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-2">
                        🔗 Vincular membresía a cuenta de usuario
                      </p>
                      <p className="text-xs text-blue-600 mb-3">
                        El cliente podrá ver esta membresía en <strong>/members/mi-membresia</strong> al iniciar sesión.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={vincularEmail}
                          onChange={e => setVincularEmail(e.target.value)}
                          placeholder="email@del.cliente"
                          className="flex-1 border border-blue-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 bg-white"
                        />
                        <button
                          onClick={() => vincularCuenta(m.id)}
                          disabled={saving || !vincularEmail.trim()}
                          className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                          style={{ background: '#1a2332' }}
                        >
                          {saving ? '...' : 'Vincular'}
                        </button>
                      </div>
                      {vincularMsg && (
                        <p className={`text-xs mt-2 font-medium ${vincularMsg.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
                          {vincularMsg}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Panel registrar pago */}
                  {isRegistrando && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-3">Registrar pago para {m.user_name}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Monto ($)</label>
                          <input type="number" value={formPago.monto}
                            onChange={e => setFormPago(f => ({ ...f, monto: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 font-semibold"
                            placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                          <input type="date" value={formPago.fecha}
                            onChange={e => setFormPago(f => ({ ...f, fecha: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Método</label>
                          <select value={formPago.metodo}
                            onChange={e => setFormPago(f => ({ ...f, metodo: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800">
                            {METODOS.map(met => <option key={met}>{met}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Concepto</label>
                          <input type="text" value={formPago.concepto}
                            onChange={e => setFormPago(f => ({ ...f, concepto: e.target.value }))}
                            placeholder={`Cuota ${mesLabel(mes)}`}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Comprobante</label>
                          <select value={formPago.comprobante}
                            onChange={e => setFormPago(f => ({ ...f, comprobante: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800">
                            <option value="">Sin comprobante</option>
                            <option>Factura A</option>
                            <option>Factura B</option>
                            <option>Factura C</option>
                            <option>Recibo X</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Notas</label>
                          <input type="text" value={formPago.notas}
                            onChange={e => setFormPago(f => ({ ...f, notas: e.target.value }))}
                            placeholder="Observaciones..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                      </div>
                      <button
                        onClick={() => registrarPago(m)}
                        disabled={saving || !formPago.monto}
                        className="mt-3 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                        style={{ background: '#0B8043' }}
                      >
                        {saving ? 'Guardando...' : `Registrar ${formPago.monto ? fmt(Number(formPago.monto)) : ''}`}
                      </button>
                    </div>
                  )}

                  {/* Historial completo */}
                  {isHistorial && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Historial — {mesLabel(mes)}</p>
                      {pagos.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Sin pagos registrados este mes.</p>
                      ) : (
                        <div className="space-y-2">
                          {pagos.map(p => (
                            <div key={p.id}
                              className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-gray-50">
                              <div className="flex items-center gap-3 text-sm flex-wrap">
                                <span className="font-bold text-green-600">{fmt(p.monto)}</span>
                                <span className="text-gray-400 text-xs">{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                                <span className="text-xs px-2 py-0.5 bg-white border border-gray-100 rounded-full text-gray-600">{p.metodo}</span>
                                {p.concepto && <span className="text-gray-500 text-xs">{p.concepto}</span>}
                                {p.notas && <span className="text-gray-400 text-xs italic">{p.notas}</span>}
                              </div>
                              <button
                                onClick={() => eliminarPago(p.id)}
                                className="text-xs text-red-400 hover:text-red-600 shrink-0 px-2 py-1"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Panel finanzas resumen del mes */}
      <div className="rounded-2xl p-4 mt-2" style={{ background: '#1a2332' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: '#c5e84a' }}>RESUMEN FINANCIERO — {mesLabel(mes).toUpperCase()}</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-white">{fmt(totalCobrado)}</p>
            <p className="text-xs text-blue-300 mt-0.5">Ingresado</p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: '#c5e84a' }}>{fmt(totalPendiente)}</p>
            <p className="text-xs text-blue-300 mt-0.5">Por cobrar</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{fmt(totalMensual)}</p>
            <p className="text-xs text-blue-300 mt-0.5">Total mensual</p>
          </div>
        </div>
      </div>
    </div>
  )
}
