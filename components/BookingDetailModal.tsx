'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  booking: {
    id: string
    title: string
    roomName: string
    status: string
    start: string
    end: string
    precioTotal: number
    montoPagado: number
    montoSena: number
    medioPago: string
    tipoCliente: string
    notas: string
    userName: string
  }
  onClose: () => void
  onUpdated: () => void
}

const MEDIO_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'Mercado Pago',
  tarjeta_debito: 'Tarjeta débito',
  tarjeta_credito: 'Tarjeta crédito',
  link: 'Link de pagos',
  canje: 'Canje',
  pendiente: 'Pendiente',
}

const TIPO_CLIENTE_LABEL: Record<string, string> = {
  externo: 'Externo',
  miembro: 'Miembro',
  abogado: 'Abogado (20% off)',
  contador: 'Contador (15% off)',
  convenio_otro: 'Convenio (10% off)',
}

export default function BookingDetailModal({ booking, onClose, onUpdated }: Props) {
  const [montoPagar, setMontoPagar] = useState('')
  const [saving, setSaving] = useState(false)

  const saldoPendiente = booking.precioTotal - booking.montoPagado
  const pagado = saldoPendiente <= 0

  function formatFecha(str: string) {
    return new Date(str).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  function formatHora(str: string) {
    return new Date(str).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  async function registrarPago() {
    if (!montoPagar || Number(montoPagar) <= 0) return
    setSaving(true)
    const supabase = createClient()
    const nuevoTotal = booking.montoPagado + Number(montoPagar)
    await supabase.from('bookings').update({ monto_pagado: nuevoTotal }).eq('id', booking.id)
    setSaving(false)
    setMontoPagar('')
    onUpdated()
  }

  async function cambiarEstado(status: string) {
    const supabase = createClient()
    await supabase.from('bookings').update({ status }).eq('id', booking.id)
    onUpdated()
    onClose()
  }

  async function eliminar() {
    if (!confirm('¿Eliminar esta reserva?')) return
    const supabase = createClient()
    await supabase.from('bookings').delete().eq('id', booking.id)
    onUpdated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl"
          style={{ background: '#0a2744' }}>
          <div>
            <p className="text-xs font-medium" style={{ color: '#c5e84a' }}>{booking.roomName}</p>
            <p className="text-white font-semibold">{formatFecha(booking.start)}</p>
            <p className="text-blue-200 text-sm">{formatHora(booking.start)} — {formatHora(booking.end)}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Cliente */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
              style={{ background: '#0a2744' }}>
              {booking.userName ? booking.userName[0].toUpperCase() : '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{booking.userName || 'Sin nombre'}</p>
              <p className="text-xs text-gray-400">{TIPO_CLIENTE_LABEL[booking.tipoCliente] || booking.tipoCliente}</p>
            </div>
            <div className="ml-auto">
              {booking.status === 'confirmed' ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Confirmada</span>
              ) : booking.status === 'pending' ? (
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#c5e84a', color: '#0a2744' }}>🕐 Pendiente</span>
              ) : (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">No vino</span>
              )}
            </div>
          </div>

          {/* Estado de pago */}
          <div className="rounded-xl p-4 border" style={{ background: pagado ? '#f0fdf4' : '#fffbeb', borderColor: pagado ? '#bbf7d0' : '#fde68a' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: pagado ? '#15803d' : '#92400e' }}>
                {pagado ? '✅ Pago completo' : '💰 Pago pendiente'}
              </span>
              <span className="text-lg font-bold" style={{ color: '#0a2744' }}>
                ${booking.precioTotal.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Seña (50%)</span>
                <span>${booking.montoSena.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Abonado</span>
                <span className="font-medium text-green-700">${booking.montoPagado.toLocaleString('es-AR')}</span>
              </div>
              {!pagado && (
                <div className="flex justify-between font-semibold border-t border-amber-200 pt-1 mt-1">
                  <span>Saldo pendiente</span>
                  <span className="text-red-600">${saldoPendiente.toLocaleString('es-AR')}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">{MEDIO_PAGO_LABEL[booking.medioPago] || booking.medioPago}</p>
          </div>

          {/* Registrar pago */}
          {!pagado && (
            <div className="flex gap-2">
              <input
                type="number"
                value={montoPagar}
                onChange={e => setMontoPagar(e.target.value)}
                placeholder="Monto a registrar"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-gray-900"
              />
              <button
                onClick={registrarPago}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ background: '#0a2744' }}
              >
                {saving ? '...' : 'Registrar'}
              </button>
            </div>
          )}

          {/* Notas */}
          {booking.notas && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              📝 {booking.notas}
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-1 border-t border-gray-100">
            {booking.status === 'pending' ? (
              <>
                <button onClick={() => cambiarEstado('confirmed')}
                  className="flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                  style={{ background: '#0B8043' }}>
                  ✅ Aprobar
                </button>
                <button onClick={() => cambiarEstado('cancelled')}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                  ✕ Rechazar
                </button>
              </>
            ) : booking.status === 'confirmed' ? (
              <>
                <button onClick={() => cambiarEstado('cancelled')}
                  className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  🔴 No vino
                </button>
                <button onClick={eliminar}
                  className="flex-1 py-2 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  🗑 Eliminar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => cambiarEstado('confirmed')}
                  className="flex-1 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  ✅ Restaurar
                </button>
                <button onClick={eliminar}
                  className="flex-1 py-2 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  🗑 Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
