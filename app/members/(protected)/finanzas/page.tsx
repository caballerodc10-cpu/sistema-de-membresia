'use client'

import { useEffect, useState } from 'react'

type Payment  = { id: string; monto: number; fecha: string; metodo: string; concepto: string | null; user_name: string }
type Booking  = { id: string; monto_pagado: number; precio_total: number; start_time: string; user_name: string; rooms: { name: string } | null }
type Expense  = { id: string; fecha: string; concepto: string; monto: number; categoria: string; metodo: string; notas: string | null }

type FinData  = {
  payments: Payment[]; bookings: Booking[]; expenses: Expense[]
  resumen: { totalIngresosMem: number; totalIngresosRes: number; totalIngresos: number; totalEgresos: number; balance: number }
}

const CATEGORIAS = ['general', 'alquiler', 'servicios', 'mantenimiento', 'limpieza', 'marketing', 'insumos', 'personal', 'impuestos', 'otro']
const METODOS    = ['efectivo', 'transferencia', 'tarjeta', 'mercadopago', 'cheque']

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-AR') }
function fmtFecha(s: string) { return new Date(s).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) }

function mesLabel(mes: string) {
  const [y, m] = mes.split('-')
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${meses[parseInt(m) - 1]} ${y}`
}
function prevMes(mes: string) { const d = new Date(mes+'-01'); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7) }
function nextMes(mes: string) { const d = new Date(mes+'-01'); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,7) }

export default function MembersFinanzasPage() {
  const mesHoy = new Date().toISOString().slice(0, 7)
  const [mes, setMes]       = useState(mesHoy)
  const [data, setData]     = useState<FinData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showEgreso, setShowEgreso] = useState(false)
  const [tabIngreso, setTabIngreso] = useState<'membresias'|'reservas'>('membresias')

  const [formEgreso, setFormEgreso] = useState({
    concepto: '', monto: '', fecha: new Date().toISOString().slice(0, 10),
    categoria: 'general', metodo: 'efectivo', notas: '',
  })

  useEffect(() => { load() }, [mes])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/members/finanzas?mes=${mes}`)
    const d   = await res.json()
    setData(d.resumen ? d : null)
    setLoading(false)
  }

  async function agregarEgreso(e: React.FormEvent) {
    e.preventDefault()
    if (!formEgreso.concepto || !formEgreso.monto) return
    setSaving(true)
    await fetch('/api/members/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formEgreso, monto: Number(formEgreso.monto) }),
    })
    setShowEgreso(false)
    setFormEgreso({ concepto: '', monto: '', fecha: new Date().toISOString().slice(0, 10), categoria: 'general', metodo: 'efectivo', notas: '' })
    await load()
    setSaving(false)
  }

  async function eliminarEgreso(id: string) {
    if (!confirm('¿Eliminar este egreso?')) return
    await fetch('/api/members/expenses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  const r = data?.resumen

  return (
    <div className="space-y-5">
      {/* Header + selector mes */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a2332' }}>Finanzas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ingresos y egresos del mes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMes(prevMes(mes))}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-gray-600">‹</button>
          <span className="font-semibold text-gray-800 min-w-36 text-center text-sm">{mesLabel(mes)}</span>
          <button onClick={() => setMes(nextMes(mes))} disabled={mes >= mesHoy}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-gray-600 disabled:opacity-30">›</button>
          {mes !== mesHoy && (
            <button onClick={() => setMes(mesHoy)} className="text-xs text-blue-500 hover:underline">Hoy</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Ingresos membresías</p>
              <p className="text-xl font-black text-green-600">{fmt(r?.totalIngresosMem || 0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Ingresos reservas</p>
              <p className="text-xl font-black text-green-600">{fmt(r?.totalIngresosRes || 0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Egresos</p>
              <p className="text-xl font-black text-red-500">{fmt(r?.totalEgresos || 0)}</p>
            </div>
            <div className={`rounded-2xl border p-4 shadow-sm ${(r?.balance || 0) >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs text-gray-400 mb-1">Balance neto</p>
              <p className={`text-xl font-black ${(r?.balance || 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {(r?.balance || 0) >= 0 ? '+' : ''}{fmt(r?.balance || 0)}
              </p>
            </div>
          </div>

          {/* Ingresos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button onClick={() => setTabIngreso('membresias')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tabIngreso === 'membresias' ? 'text-green-800 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                💳 Membresías ({(data?.payments?.length ?? 0) || 0})
              </button>
              <button onClick={() => setTabIngreso('reservas')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tabIngreso === 'reservas' ? 'text-green-800 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                📅 Reservas ({(data?.bookings?.length ?? 0) || 0})
              </button>
            </div>

            {tabIngreso === 'membresias' && (
              <div className="divide-y divide-gray-50">
                {!(data?.payments?.length ?? 0) ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin cobros de membresías en {mesLabel(mes)}</p>
                ) : (data?.payments || []).map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.user_name}</p>
                      <p className="text-xs text-gray-400">{p.concepto || 'Pago membresía'} · {fmtFecha(p.fecha)} · {p.metodo}</p>
                    </div>
                    <p className="font-black text-green-600 text-sm">{fmt(p.monto)}</p>
                  </div>
                ))}
                {(data?.payments?.length ?? 0) > 0 && (
                  <div className="flex justify-between px-4 py-3 bg-green-50">
                    <p className="text-sm font-bold text-green-800">Total membresías</p>
                    <p className="font-black text-green-700">{fmt(r?.totalIngresosMem || 0)}</p>
                  </div>
                )}
              </div>
            )}

            {tabIngreso === 'reservas' && (
              <div className="divide-y divide-gray-50">
                {!(data?.bookings?.length ?? 0) ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin cobros de reservas en {mesLabel(mes)}</p>
                ) : (data?.bookings || []).map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{b.user_name}</p>
                      <p className="text-xs text-gray-400">{b.rooms?.name || 'Sala'} · {fmtFecha(b.start_time)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-green-600 text-sm">{fmt(b.monto_pagado)}</p>
                      {b.precio_total > b.monto_pagado && (
                        <p className="text-xs text-red-400">Resta {fmt(b.precio_total - b.monto_pagado)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {(data?.bookings?.length ?? 0) > 0 && (
                  <div className="flex justify-between px-4 py-3 bg-green-50">
                    <p className="text-sm font-bold text-green-800">Total reservas</p>
                    <p className="font-black text-green-700">{fmt(r?.totalIngresosRes || 0)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Egresos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-gray-800">📤 Egresos / Gastos</p>
              <button onClick={() => setShowEgreso(v => !v)}
                className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                style={{ background: '#1a2332' }}>
                {showEgreso ? '✕ Cancelar' : '+ Agregar gasto'}
              </button>
            </div>

            {/* Form nuevo egreso */}
            {showEgreso && (
              <form onSubmit={agregarEgreso} className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Concepto *</label>
                    <input type="text" required value={formEgreso.concepto}
                      onChange={e => setFormEgreso(d => ({ ...d, concepto: e.target.value }))}
                      placeholder="Ej: Servicio de limpieza, Alquiler, Internet..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Monto ($) *</label>
                    <input type="number" required min="1" value={formEgreso.monto}
                      onChange={e => setFormEgreso(d => ({ ...d, monto: e.target.value }))}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
                    <input type="date" value={formEgreso.fecha}
                      onChange={e => setFormEgreso(d => ({ ...d, fecha: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
                    <select value={formEgreso.categoria}
                      onChange={e => setFormEgreso(d => ({ ...d, categoria: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white">
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Método de pago</label>
                    <select value={formEgreso.metodo}
                      onChange={e => setFormEgreso(d => ({ ...d, metodo: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white">
                      {METODOS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notas (opcional)</label>
                    <input type="text" value={formEgreso.notas}
                      onChange={e => setFormEgreso(d => ({ ...d, notas: e.target.value }))}
                      placeholder="Observaciones..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white" />
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: '#dc2626' }}>
                  {saving ? 'Guardando...' : 'Registrar egreso'}
                </button>
              </form>
            )}

            {/* Lista egresos */}
            <div className="divide-y divide-gray-50">
              {!data?.expenses?.length ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin egresos registrados en {mesLabel(mes)}</p>
              ) : data.expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{e.concepto}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">{e.categoria}</span>
                    </div>
                    <p className="text-xs text-gray-400">{fmtFecha(e.fecha)} · {e.metodo}{e.notas ? ` · ${e.notas}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-red-500 text-sm">{fmt(e.monto)}</p>
                    <button onClick={() => eliminarEgreso(e.id)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                  </div>
                </div>
              ))}
              {data?.expenses && data.expenses.length > 0 && (
                <div className="flex justify-between px-4 py-3 bg-red-50">
                  <p className="text-sm font-bold text-red-800">Total egresos</p>
                  <p className="font-black text-red-600">{fmt(r?.totalEgresos || 0)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Balance final destacado */}
          <div className="rounded-2xl p-5" style={{ background: '#1a2332' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#c5e84a' }}>
              RESUMEN {mesLabel(mes).toUpperCase()}
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-green-400">{fmt(r?.totalIngresos || 0)}</p>
                <p className="text-xs text-blue-300 mt-1">Total ingresos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-400">{fmt(r?.totalEgresos || 0)}</p>
                <p className="text-xs text-blue-300 mt-1">Total egresos</p>
              </div>
              <div>
                <p className={`text-2xl font-black ${(r?.balance || 0) >= 0 ? 'text-white' : 'text-red-400'}`}
                  style={(r?.balance || 0) >= 0 ? { color: '#c5e84a' } : {}}>
                  {(r?.balance || 0) >= 0 ? '+' : ''}{fmt(r?.balance || 0)}
                </p>
                <p className="text-xs text-blue-300 mt-1">Balance neto</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
