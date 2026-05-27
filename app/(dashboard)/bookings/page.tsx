'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Booking } from '@/types'
import ClientRequestModal from '@/components/ClientRequestModal'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tieneMembresía, setTieneMembresia] = useState(false)

  useEffect(() => { loadBookings() }, [])

  async function loadBookings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data }, { data: mem }] = await Promise.all([
      supabase.from('bookings')
        .select('*, rooms(name, price_per_hour)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false }),
      supabase.from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .single(),
    ])

    setBookings(data || [])
    setTieneMembresia(!!mem)
    setLoading(false)
  }

  async function cancelBooking(id: string) {
    if (!confirm('¿Cancelar esta solicitud?')) return
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    loadBookings()
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
  }
  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const pending  = bookings.filter(b => b.status === 'pending')
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) > new Date())
  const past     = bookings.filter(b => b.status !== 'confirmed' && b.status !== 'pending' || new Date(b.start_time) <= new Date())

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0a2744' }}>Mis Reservas</h1>
        {tieneMembresía && (
          <button
            onClick={() => setShowModal(true)}
            className="text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2"
            style={{ background: '#0a2744' }}
          >
            + Solicitar turno
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Cargando...</div>
      ) : (
        <>
          {/* Pendientes de aprobación */}
          {pending.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#0a2744' }}>
                🕐 Pendientes de aprobación
              </h2>
              <div className="space-y-3 mb-6">
                {pending.map(b => (
                  <div key={b.id} className="rounded-xl border-2 p-4 flex items-center justify-between gap-4"
                    style={{ borderColor: '#c5e84a', background: '#fffef0' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                        style={{ background: '#0a2744', color: '#c5e84a' }}>
                        {(b.rooms?.name || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{b.rooms?.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(b.start_time)} · {formatTime(b.start_time)} – {formatTime(b.end_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ background: '#c5e84a', color: '#0a2744' }}>
                        En revisión
                      </span>
                      <button onClick={() => cancelBooking(b.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Próximas confirmadas */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximas</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 mb-6">
              No tenés reservas confirmadas próximas
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {upcoming.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-sm">
                      {(b.rooms?.name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{b.rooms?.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(b.start_time)} · {formatTime(b.start_time)} – {formatTime(b.end_time)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Confirmada ✅</span>
                </div>
              ))}
            </div>
          )}

          {/* Historial */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial</h2>
          {past.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Sin historial</div>
          ) : (
            <div className="space-y-2">
              {past.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-bold text-sm">
                      {(b.rooms?.name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{b.rooms?.name}</p>
                      <p className="text-sm text-gray-400">
                        {formatDate(b.start_time)} · {formatTime(b.start_time)} – {formatTime(b.end_time)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    b.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {b.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <ClientRequestModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadBookings() }}
        />
      )}
    </div>
  )
}
