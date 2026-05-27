'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Consumo = {
  id: string
  fecha: string
  user_name: string
  sala: string
  tipo: string
  cantidad: number
  precio_unit: number
  total: number
  notas: string
}

const TIPOS = [
  { value: 'cafe', label: '☕ Café / Infusión', precio: 500 },
  { value: 'impresion', label: '🖨️ Impresión (hoja)', precio: 200 },
  { value: 'locker', label: '🔒 Locker (día)', precio: 1000 },
  { value: 'otro', label: '📦 Otro', precio: 0 },
]

const SALAS = ['Alocasia', 'Begonia', 'Pothus 2', 'Pandurata', 'Peperomia', 'Calathea', 'Pothus', 'Bromelia', 'Espacio común']

export default function ConsumosPage() {
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFecha, setFilterFecha] = useState(new Date().toISOString().split('T')[0])

  // Form
  const [userName, setUserName] = useState('')
  const [sala, setSala] = useState('')
  const [tipo, setTipo] = useState('cafe')
  const [cantidad, setCantidad] = useState('1')
  const [precioUnit, setPrecioUnit] = useState('500')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadConsumos() }, [filterFecha])

  async function loadConsumos() {
    const supabase = createClient()
    const { data } = await supabase
      .from('consumos')
      .select('*')
      .eq('fecha', filterFecha)
      .order('created_at', { ascending: false })
    setConsumos(data || [])
    setLoading(false)
  }

  function handleTipoChange(t: string) {
    setTipo(t)
    const found = TIPOS.find(x => x.value === t)
    if (found) setPrecioUnit(found.precio.toString())
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!userName.trim()) return
    setSaving(true)
    const total = Number(cantidad) * Number(precioUnit)
    const supabase = createClient()
    await supabase.from('consumos').insert({
      fecha: filterFecha,
      user_name: userName,
      sala,
      tipo,
      cantidad: Number(cantidad),
      precio_unit: Number(precioUnit),
      total,
      notas,
    })
    setSaving(false)
    setUserName('')
    setSala('')
    setTipo('cafe')
    setPrecioUnit('500')
    setCantidad('1')
    setNotas('')
    setShowForm(false)
    loadConsumos()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('consumos').delete().eq('id', id)
    loadConsumos()
  }

  const totalDia = consumos.reduce((s, c) => s + c.total, 0)

  const tipoLabel: Record<string, string> = {
    cafe: '☕', impresion: '🖨️', locker: '🔒', otro: '📦'
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0a2744' }}>Consumos del día</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={filterFecha} onChange={e => setFilterFecha(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900" />
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90"
            style={{ background: '#0a2744' }}>
            + Registrar
          </button>
        </div>
      </div>

      {/* Total del día */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold" style={{ color: '#0a2744' }}>{consumos.length}</p>
          <p className="text-xs text-gray-500 mt-1">consumos registrados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-700">${totalDia.toLocaleString('es-AR')}</p>
          <p className="text-xs text-gray-500 mt-1">total del día</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{consumos.filter(c => c.tipo === 'cafe').reduce((s, c) => s + c.cantidad, 0)}</p>
          <p className="text-xs text-gray-500 mt-1">☕ cafés servidos</p>
        </div>
      </div>

      {/* Formulario rápido */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4" style={{ color: '#0a2744' }}>Registrar consumo</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente</label>
              <input type="text" value={userName} onChange={e => setUserName(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900"
                placeholder="Ej: Juan García" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sala / Espacio</label>
              <select value={sala} onChange={e => setSala(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900">
                <option value="">Sin sala asignada</option>
                {SALAS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={tipo} onChange={e => handleTipoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min="1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio unit. ($)</label>
                <input type="number" value={precioUnit} onChange={e => setPrecioUnit(e.target.value)} min="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900"
                placeholder="Ej: cortado doble, 3 hojas color..." />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Total: <span style={{ color: '#0a2744' }}>${(Number(cantidad) * Number(precioUnit)).toLocaleString('es-AR')}</span>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                  style={{ background: '#0a2744' }}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="h-40 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : consumos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          Sin consumos registrados para esta fecha
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-3 font-medium text-gray-500">Cliente</th>
                <th className="px-4 py-3 font-medium text-gray-500">Sala</th>
                <th className="px-4 py-3 font-medium text-gray-500">Cant.</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Total</th>
                <th className="px-4 py-3 font-medium text-gray-500">Notas</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {consumos.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="text-lg">{tipoLabel[c.tipo]}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.user_name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.sala || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.cantidad}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: '#0a2744' }}>
                    ${c.total.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.notas || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(c.id)}
                      className="text-gray-300 hover:text-red-500 text-lg transition-colors">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
