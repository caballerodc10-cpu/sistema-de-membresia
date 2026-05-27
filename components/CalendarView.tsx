'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { createClient } from '@/lib/supabase'
import BookingModal from '@/components/BookingModal'
import BookingDetailModal from '@/components/BookingDetailModal'
import DailySchedulePanel from '@/components/DailySchedulePanel'
import ClientRequestModal from '@/components/ClientRequestModal'

const ROOM_COLORS: Record<string, string> = {
  'Alocasia':  '#E67C73',
  'Begonia':   '#0B8043',
  'Pothus 2':  '#33B679',
  'Pandurata': '#7986CB',
  'Peperomia': '#F6BF26',
  'Calathea':  '#3F51B5',
  'Pothus':    '#F4511E',
  'Bromelia':  '#039BE5',
}
const NO_SHOW_COLOR = '#D50000'
const PENDING_COLOR = '#F9A825'

function formatHora(dateStr: string) {
  const d = new Date(dateStr)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes()
  return m === 0 ? `${h}` : `${h}:${m.toString().padStart(2, '0')}`
}

export default function CalendarView({ isAdmin }: { isAdmin: boolean }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [clientModal, setClientModal] = useState<{ date: string; time?: string } | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)
  const [panelDate, setPanelDate] = useState<string>(todayStr)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(name)')
      .in('status', ['confirmed', 'cancelled', 'pending'])
    setBookings(data || [])
    setLoading(false)
  }

  const adminEvents = bookings.map(b => {
    const roomName = (b.rooms?.name || 'SALA').toUpperCase()
    const desde = formatHora(b.start_time)
    const hasta = formatHora(b.end_time)
    const nombre = b.user_name || ''
    const pagado = (b.monto_pagado || 0) >= (b.precio_total || 0) && (b.precio_total || 0) > 0
    const pagoEmoji = pagado ? ' ✅' : ''
    const pendingTag = b.status === 'pending' ? ' 🕐 PENDIENTE' : ''
    const title = nombre
      ? `${roomName} (${desde} A ${hasta}) ${nombre.toUpperCase()}${pagoEmoji}${pendingTag}`
      : `${roomName} (${desde} A ${hasta})${pagoEmoji}${pendingTag}`
    const color = b.status === 'cancelled' ? NO_SHOW_COLOR : b.status === 'pending' ? PENDING_COLOR : ROOM_COLORS[b.rooms?.name || ''] || '#616161'
    return {
      id: b.id, title,
      start: b.start_time, end: b.end_time,
      backgroundColor: color, borderColor: color,
      textColor: ['#F6BF26', '#E67C73'].includes(color) ? '#000' : '#fff',
      extendedProps: { booking: b },
    }
  })

  const clientEvents = bookings
    .filter(b => b.status === 'confirmed')
    .map(b => {
      const roomName = (b.rooms?.name || 'SALA').toUpperCase()
      const desde = formatHora(b.start_time)
      const hasta = formatHora(b.end_time)
      const color = ROOM_COLORS[b.rooms?.name || ''] || '#616161'
      return {
        id: b.id,
        title: `${roomName} (${desde} A ${hasta}) — Ocupada`,
        start: b.start_time,
        end: b.end_time,
        backgroundColor: color,
        borderColor: color,
        textColor: ['#F6BF26', '#E67C73'].includes(color) ? '#000' : '#fff',
      }
    })

  function handleEventClick(info: any) {
    if (!isAdmin) return
    const b = info.event.extendedProps.booking
    setSelectedBooking({
      id: b.id,
      title: info.event.title,
      roomName: b.rooms?.name || '',
      status: b.status,
      start: b.start_time,
      end: b.end_time,
      precioTotal: b.precio_total || 0,
      montoPagado: b.monto_pagado || 0,
      montoSena: b.monto_sena || 0,
      medioPago: b.medio_pago || 'efectivo',
      tipoCliente: b.tipo_cliente || 'externo',
      notas: b.notes || '',
      userName: b.user_name || '',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0a2744' }}>
            {isAdmin ? 'Calendario de Reservas' : 'Disponibilidad de Salas'}
          </h1>
          {!isAdmin && (
            <p className="text-sm text-gray-500 mt-0.5">
              Consultá los horarios disponibles para esta semana
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedDate(''); setShowNewModal(true) }}
              className="text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: '#0a2744' }}
            >
              + Nueva reserva
            </button>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(ROOM_COLORS).map(([sala, color]) => (
          <span key={sala} className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: color, color: ['#F6BF26', '#E67C73'].includes(color) ? '#000' : '#fff' }}>
            {sala}
          </span>
        ))}
        {isAdmin && (
          <>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: NO_SHOW_COLOR }}>No vino</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full text-gray-900" style={{ background: PENDING_COLOR }}>🕐 Pendiente</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">✅ = pago completo</span>
          </>
        )}
        {!isAdmin && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            Color = sala ocupada · Espacios en blanco = disponible
          </span>
        )}
      </div>

      <style>{`
        .fc .fc-timegrid-slot { height: 38px !important; }
        .fc .fc-timegrid-slot-label { font-size: 11px; }
        .fc .fc-col-header-cell { font-size: 12px; padding: 4px 0; }
        .fc .fc-event { font-size: 12px; font-weight: 700; line-height: 1.3; }
        .fc .fc-event-title { white-space: normal; overflow: visible; }
        .fc .fc-timegrid-event .fc-event-main { padding: 3px 5px; }
        .fc .fc-toolbar-title { font-size: 15px; }
        .fc .fc-button { font-size: 12px; padding: 4px 8px; }
      `}</style>

      <div className="flex gap-4 items-start">
        {/* Calendario */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale={esLocale}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={isAdmin ? adminEvents : clientEvents}
                selectable={!isAdmin}
                selectMirror={!isAdmin}
                select={!isAdmin ? (info => {
                  const date = info.startStr.slice(0, 10)
                  const time = info.startStr.slice(11, 16) || '09:00'
                  setClientModal({ date, time })
                  setPanelDate(date)
                }) : undefined}
                dateClick={isAdmin ? (info => {
                  setSelectedDate(info.dateStr)
                  setShowNewModal(true)
                  setPanelDate(info.dateStr.slice(0, 10))
                }) : (info => {
                  const date = info.dateStr.slice(0, 10)
                  const time = info.dateStr.length > 10 ? info.dateStr.slice(11, 16) : '09:00'
                  setClientModal({ date, time })
                  setPanelDate(date)
                })}
                eventClick={isAdmin ? handleEventClick : undefined}
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
                allDaySlot={false}
                contentHeight="auto"
                slotDuration="01:00:00"
                slotLabelInterval="01:00:00"
                expandRows={true}
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                eventClassNames={isAdmin ? 'cursor-pointer' : 'cursor-pointer hover:opacity-80'}
                slotMinWidth={60}
              />
            </div>
          )}
        </div>

        {/* Panel agenda del día */}
        <DailySchedulePanel
          bookings={bookings}
          isAdmin={isAdmin}
          selectedDate={panelDate}
          onDateChange={setPanelDate}
        />
      </div>

      {!isAdmin && (
        <div className="mt-4 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: '#0a2744' }}>
          <div>
            <p className="text-white font-semibold">📅 Hacé click en un horario disponible para solicitar tu turno</p>
            <p className="text-blue-200 text-sm mt-0.5">O escribinos por WhatsApp · las celdas en blanco están disponibles</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setClientModal({ date: new Date().toISOString().slice(0, 10) })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#c5e84a', color: '#0a2744' }}>
              + Solicitar turno
            </button>
            <a href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20consultar%20disponibilidad%20para%20reservar%20una%20sala"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#25D366', color: '#fff' }}>
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdated={() => { setSelectedBooking(null); loadData() }}
        />
      )}

      {showNewModal && (
        <BookingModal
          initialDate={selectedDate}
          onClose={() => setShowNewModal(false)}
          onSaved={() => { setShowNewModal(false); loadData() }}
        />
      )}

      {clientModal && (
        <ClientRequestModal
          initialDate={clientModal.date}
          initialStartTime={clientModal.time}
          onClose={() => setClientModal(null)}
          onSaved={() => { setClientModal(null); loadData() }}
        />
      )}
    </div>
  )
}
