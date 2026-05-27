'use client'

import { useEffect, useState } from 'react'

type MemberRow = {
  id: string
  user_id: string
  user_name: string
  plan: string
  hours_total: number
  hours_used: number
  valid_until: string | null
  monto_mensual: number
  notas: string | null
  created_at: string
}

type PaymentRow = {
  id: string
  membership_id: string
  user_name: string
  monto: number
  fecha: string
  metodo: string
  concepto: string | null
  notas: string | null
  created_at: string
}

type ProfileRow = {
  id: string
  full_name: string
  email: string
}

const METODOS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta']
const PLANES = ['Visitante', 'Flex', 'Full', 'Residente', 'Alocasia', 'Begonia', 'Pothus 2', 'Peperomia', 'Calathea', 'Pothus', 'Bromelia', 'SUM', 'Flex Compartido']

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

function horasBar(m: MemberRow) {
  if (m.hours_total <= 0) return null
  const pct = Math.min(100, Math.round((m.hours_used / m.hours_total) * 100))
  const color = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-green-400'
  return { pct, color }
}

export default function MembershipsAdminPage() {
  const mesHoy = new Date().toISOString().slice(0, 7)
  const [mes, setMes] = useState(mesHoy)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [registrandoId, setRegistrandoId] = useState<string | null>(null)
  const [historialId, setHistorialId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form pago
  const [formPago, setFormPago] = useState({
    monto: '',
    fecha: new Date().toISOString().slice(0, 10),
    metodo: 'Efectivo',
    concepto: '',
    notas: '',
  })

  // Form edición membresía
  const [formEdit, setFormEdit] = useState<Partial<MemberRow & { valid_until: string }>>({})

  // Form nueva membresía
  const [formNuevo, setFormNuevo] = useState({
    tipo: 'empresa' as 'usuario' | 'empresa',
    user_id: '',
    nombre_empresa: '',
    plan: 'Alocasia',
    hours_total: '',
    monto_mensual: '',
    notas: '',
  })

  useEffect(() => { load() }, [mes])

  async function load() {
    setLoading(true)
    const [memsRes, paysRes, profsRes] = await Promise.all([
      fetch('/api/admin/memberships'),
      fetch(`/api/admin/payments?mes=${mes}`),
      fetch('/api/admin/profiles'),
    ])
    const [mems, pays, profs] = await Promise.all([memsRes.json(), paysRes.json(), profsRes.json()])
    setMembers(Array.isArray(mems) ? mems : [])
    setPayments(Array.isArray(pays) ? pays : [])
    setProfiles(Array.isArray(profs) ? profs : [])
    setLoading(false)
  }

  function cobradoMes(membId: string) {
    return payments.filter(p => p.membership_id === membId).reduce((a, p) => a + p.monto, 0)
  }

  function saldo(m: MemberRow) {
    return Math.max(0, (m.monto_mensual || 0) - cobradoMes(m.id))
  }

  function pagosDeMember(membId: string) {
    return payments.filter(p => p.membership_id === membId)
  }

  async function registrarPago(m: MemberRow) {
    if (!formPago.monto || Number(formPago.monto) <= 0) return
    setSaving(true)
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
        notas: formPago.notas || null,
      }),
    })
    setRegistrandoId(null)
    setFormPago({ monto: '', fecha: new Date().toISOString().slice(0, 10), metodo: 'Efectivo', concepto: '', notas: '' })
    await load()
    setSaving(false)
  }

  async function eliminarPago(pagoId: string) {
    if (!confirm('¿Eliminar este pago?')) return
    await fetch(`/api/admin/payments/${pagoId}`, { method: 'DELETE' })
    await load()
  }

  async function guardarEdicion(id: string) {
    setSaving(true)
    await fetch(`/api/admin/memberships/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formEdit),
    })
    setEditandoId(null)
    await load()
    setSaving(false)
  }

  async function crearMembresia() {
    const nombre = formNuevo.tipo === 'usuario'
      ? profiles.find(p => p.id === formNuevo.user_id)?.full_name || ''
      : formNuevo.nombre_empresa.trim()
    if (!nombre || !formNuevo.monto_mensual) return
    setSaving(true)
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    await fetch('/api/admin/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: formNuevo.tipo === 'usuario' ? formNuevo.user_id : null,
        user_name: nombre,
        plan: formNuevo.plan,
        hours_total: Number(formNuevo.hours_total) || 0,
        hours_used: 0,
        monto_mensual: Number(formNuevo.monto_mensual),
        notas: formNuevo.notas || null,
        valid_until: nextMonth.toISOString().slice(0, 10),
      }),
    })
    setShowNuevo(false)
    setFormNuevo({ tipo: 'empresa', user_id: '', nombre_empresa: '', plan: 'Alocasia', hours_total: '', monto_mensual: '', notas: '' })
    await load()
    setSaving(false)
  }

  async function eliminarMembresia(id: string) {
    if (!confirm('¿Eliminar esta membresía? También se borrarán sus pagos.')) return
    await fetch(`/api/admin/memberships/${id}`, { method: 'DELETE' })
    await load()
  }

  // Resumen del mes
  const totalMensual = members.reduce((a, m) => a + (m.monto_mensual || 0), 0)
  const totalCobrado = members.reduce((a, m) => a + cobradoMes(m.id), 0)
  const totalPendiente = members.reduce((a, m) => a + saldo(m), 0)
  const alDia = members.filter(m => saldo(m) === 0 && m.monto_mensual > 0).length
  const conDeuda = members.filter(m => saldo(m) > 0).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0a2744' }}>Membresías</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} miembros · cuenta corriente</p>
        </div>
        <button
          onClick={() => setShowNuevo(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#0a2744' }}
        >
          + Nueva membresía
        </button>
      </div>

      {/* Selector de mes */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMes(prevMes(mes))} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600">‹</button>
        <span className="font-semibold text-gray-800 min-w-36 text-center">{mesLabel(mes)}</span>
        <button onClick={() => setMes(nextMes(mes))} disabled={mes >= mesHoy}
          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-30">›</button>
        {mes !== mesHoy && (
          <button onClick={() => setMes(mesHoy)} className="text-xs text-blue-600 hover:underline">Volver al mes actual</button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl font-bold" style={{ color: '#0a2744' }}>{fmt(totalMensual)}</p>
          <p className="text-xs text-gray-500 mt-1">Facturación mensual</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{fmt(totalCobrado)}</p>
          <p className="text-xs text-gray-500 mt-1">Cobrado en {mesLabel(mes)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl font-bold text-red-500">{fmt(totalPendiente)}</p>
          <p className="text-xs text-gray-500 mt-1">Pendiente de cobro</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl font-bold text-amber-500">{conDeuda} / {alDia}</p>
          <p className="text-xs text-gray-500 mt-1">Con deuda / Al día</p>
        </div>
      </div>

      {/* Form nueva membresía */}
      {showNuevo && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Nueva membresía</h3>

          {/* Toggle tipo */}
          <div className="flex gap-2 mb-4">
            {(['empresa', 'usuario'] as const).map(t => (
              <button key={t} onClick={() => setFormNuevo(d => ({ ...d, tipo: t }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formNuevo.tipo === t ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                style={formNuevo.tipo === t ? { background: '#0a2744' } : {}}>
                {t === 'empresa' ? '🏢 Empresa / Cliente' : '👤 Usuario registrado'}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {formNuevo.tipo === 'empresa' ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de la empresa / cliente</label>
                <input type="text" value={formNuevo.nombre_empresa}
                  onChange={e => setFormNuevo(d => ({ ...d, nombre_empresa: e.target.value }))}
                  placeholder="Ej: Camba Cua, AWA, Club Robótica..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Usuario registrado</label>
                <select value={formNuevo.user_id} onChange={e => setFormNuevo(d => ({ ...d, user_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">
                  <option value="">— Seleccionar —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Plan / Sala</label>
              <select value={formNuevo.plan} onChange={e => setFormNuevo(d => ({ ...d, plan: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">
                {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Horas contratadas (0 = sin límite)</label>
              <input type="number" value={formNuevo.hours_total}
                onChange={e => setFormNuevo(d => ({ ...d, hours_total: e.target.value }))}
                placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto mensual ($)</label>
              <input type="number" value={formNuevo.monto_mensual}
                onChange={e => setFormNuevo(d => ({ ...d, monto_mensual: e.target.value }))}
                placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notas</label>
              <input type="text" value={formNuevo.notas}
                onChange={e => setFormNuevo(d => ({ ...d, notas: e.target.value }))}
                placeholder="Ej: 40hs Begonia, acuerdo 3 meses..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={crearMembresia}
              disabled={saving || !formNuevo.monto_mensual || (formNuevo.tipo === 'empresa' ? !formNuevo.nombre_empresa.trim() : !formNuevo.user_id)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#0a2744' }}>
              {saving ? 'Guardando...' : 'Crear membresía'}
            </button>
            <button onClick={() => setShowNuevo(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 bg-gray-100">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista de miembros */}
      {loading ? (
        <div className="h-40 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : members.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">No hay membresías registradas.</div>
      ) : (
        <div className="space-y-3">
          {members.map(m => {
            const cobrado = cobradoMes(m.id)
            const debe = saldo(m)
            const pagos = pagosDeMember(m.id)
            const bar = horasBar(m)
            const isRegistrando = registrandoId === m.id
            const isHistorial = historialId === m.id
            const isEditando = editandoId === m.id

            return (
              <div key={m.id}
                className={`bg-white rounded-2xl border shadow-sm ${debe > 0 ? 'border-red-100' : 'border-gray-100'}`}>
                <div className="p-4">

                  {/* Cabecera del miembro */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-900">{m.user_name || '—'}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{m.plan}</span>
                        {debe > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                            Debe {fmt(debe)}
                          </span>
                        )}
                        {debe === 0 && m.monto_mensual > 0 && cobrado > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Al día</span>
                        )}
                      </div>

                      {/* Barra de horas */}
                      {bar && (
                        <div className="mt-2 mb-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{m.hours_used} / {m.hours_total} hs usadas</span>
                            <span>Restan {m.hours_total - m.hours_used} hs</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Financiero */}
                      <div className="flex flex-wrap gap-4 text-sm mt-1">
                        <span className="text-gray-500">Cuota: <strong className="text-gray-800">{fmt(m.monto_mensual)}</strong></span>
                        <span className="text-gray-500">Cobrado: <strong className="text-green-600">{fmt(cobrado)}</strong></span>
                        {debe > 0 && <span className="text-gray-500">Pendiente: <strong className="text-red-500">{fmt(debe)}</strong></span>}
                      </div>

                      {m.notas && <p className="text-xs text-gray-400 italic mt-1">{m.notas}</p>}
                      {m.valid_until && (
                        <p className="text-xs text-gray-400 mt-0.5">Vence: {new Date(m.valid_until).toLocaleDateString('es-AR')}</p>
                      )}

                      {/* Últimos pagos del mes (compacto) */}
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

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setRegistrandoId(isRegistrando ? null : m.id)
                          setFormPago(f => ({ ...f, monto: String(debe || m.monto_mensual) }))
                          setHistorialId(null)
                          setEditandoId(null)
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
                        style={{ background: '#0B8043' }}
                      >
                        {isRegistrando ? 'Cancelar' : '+ Pago'}
                      </button>
                      <button
                        onClick={() => {
                          setHistorialId(isHistorial ? null : m.id)
                          setRegistrandoId(null)
                          setEditandoId(null)
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium"
                      >
                        Historial {pagos.length > 0 ? `(${pagos.length})` : ''}
                      </button>
                      <button
                        onClick={() => {
                          setEditandoId(isEditando ? null : m.id)
                          setFormEdit({ hours_used: m.hours_used, hours_total: m.hours_total, monto_mensual: m.monto_mensual, valid_until: m.valid_until || '', notas: m.notas || '', telefono: (m as any).telefono || '' } as any)
                          setRegistrandoId(null)
                          setHistorialId(null)
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium"
                      >
                        Editar
                      </button>
                      <button onClick={() => eliminarMembresia(m.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 font-medium">
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Panel registrar pago */}
                  {isRegistrando && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-3">Registrar pago</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Monto ($)</label>
                          <input type="number" value={formPago.monto}
                            onChange={e => setFormPago(f => ({ ...f, monto: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 font-semibold"
                            placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                          <input type="date" value={formPago.fecha}
                            onChange={e => setFormPago(f => ({ ...f, fecha: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Método</label>
                          <select value={formPago.metodo}
                            onChange={e => setFormPago(f => ({ ...f, metodo: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800">
                            {METODOS.map(met => <option key={met}>{met}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Concepto</label>
                          <input type="text" value={formPago.concepto}
                            onChange={e => setFormPago(f => ({ ...f, concepto: e.target.value }))}
                            placeholder={`Cuota ${mesLabel(mes)}`}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
                        <input type="text" value={formPago.notas}
                          onChange={e => setFormPago(f => ({ ...f, notas: e.target.value }))}
                          placeholder="Observaciones..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                      </div>
                      <button
                        onClick={() => registrarPago(m)}
                        disabled={saving || !formPago.monto}
                        className="mt-3 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
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
                            <div key={p.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-3 text-sm flex-wrap">
                                <span className="font-bold text-green-600">{fmt(p.monto)}</span>
                                <span className="text-gray-400">{new Date(p.fecha).toLocaleDateString('es-AR')}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{p.metodo}</span>
                                {p.concepto && <span className="text-gray-500 text-xs">{p.concepto}</span>}
                                {p.notas && <span className="text-gray-400 text-xs italic">{p.notas}</span>}
                              </div>
                              <button onClick={() => eliminarPago(p.id)}
                                className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Panel edición */}
                  {isEditando && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-3">Editar membresía</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Horas totales</label>
                          <input type="number" value={formEdit.hours_total ?? ''}
                            onChange={e => setFormEdit(f => ({ ...f, hours_total: Number(e.target.value) }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Horas usadas</label>
                          <input type="number" value={formEdit.hours_used ?? ''}
                            onChange={e => setFormEdit(f => ({ ...f, hours_used: Number(e.target.value) }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Monto mensual ($)</label>
                          <input type="number" value={formEdit.monto_mensual ?? ''}
                            onChange={e => setFormEdit(f => ({ ...f, monto_mensual: Number(e.target.value) }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Vence</label>
                          <input type="date" value={formEdit.valid_until ?? ''}
                            onChange={e => setFormEdit(f => ({ ...f, valid_until: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Teléfono WhatsApp (sin 0, sin 15)</label>
                          <input type="text" value={(formEdit as any).telefono ?? ''}
                            onChange={e => setFormEdit(f => ({ ...f, telefono: e.target.value } as any))}
                            placeholder="Ej: 3794123456"
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Notas</label>
                          <input type="text" value={formEdit.notas ?? ''}
                            onChange={e => setFormEdit(f => ({ ...f, notas: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800" />
                        </div>
                      </div>
                      <button onClick={() => guardarEdicion(m.id)} disabled={saving}
                        className="mt-3 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: '#0a2744' }}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
