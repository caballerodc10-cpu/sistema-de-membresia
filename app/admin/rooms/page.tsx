'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Room } from '@/types'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [pricePerHour, setPricePerHour] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadRooms() }, [])

  async function loadRooms() {
    const supabase = createClient()
    const { data } = await supabase.from('rooms').select('*').order('name')
    setRooms(data || [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('rooms').insert({ name, capacity: Number(capacity), price_per_hour: Number(pricePerHour), description })
    setSaving(false)
    setShowForm(false)
    setName(''); setCapacity(''); setPricePerHour(''); setDescription('')
    loadRooms()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta sala? Se cancelarán las reservas asociadas.')) return
    const supabase = createClient()
    await supabase.from('rooms').delete().eq('id', id)
    loadRooms()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Salas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nueva sala
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Nueva sala</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la sala</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Sala A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (personas)</label>
              <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio por hora ($)</label>
              <input type="number" value={pricePerHour} onChange={e => setPricePerHour(e.target.value)} required min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Proyector, pizarrón, etc." />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">
                {saving ? 'Guardando...' : 'Guardar sala'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Cargando...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold">
                  {room.name[0].toUpperCase()}
                </div>
                <button onClick={() => handleDelete(room.id)} className="text-gray-300 hover:text-red-500 transition-colors text-xl">×</button>
              </div>
              <h3 className="font-semibold text-gray-900">{room.name}</h3>
              {room.description && <p className="text-sm text-gray-500 mt-1">{room.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>👤 {room.capacity} personas</span>
                <span>💲 ${room.price_per_hour}/hr</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
