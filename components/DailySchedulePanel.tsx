'use client'

import { useState } from 'react'

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

const ROOMS_ORDER = ['Alocasia', 'Begonia', 'Pothus 2', 'Pandurata', 'Peperomia', 'Calathea', 'Pothus', 'Bromelia']
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_LABELS = ['L','M','X','J','V','S','D']

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function addMin(dateStr: string, min: number) {
  return new Date(new Date(dateStr).getTime() + min * 60000).toISOString()
}

type Booking = {
  id: string
  start_time: string
  end_time: string
  user_name?: string
  status: string
  rooms?: { name: string }
}

type Props = {
  bookings: Booking[]
  isAdmin: boolean
  selectedDate: string
  onDateChange: (d: string) => void
}

export default function DailySchedulePanel({ bookings, isAdmin, selectedDate, onDateChange }: Props) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate + 'T12:00:00')
    return { month: d.getMonth(), year: d.getFullYear() }
  })

  // Calendar grid math
  const firstDayOfMonth = new Date(viewMonth.year, viewMonth.month, 1)
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate()
  const startPad = (firstDayOfMonth.getDay() + 6) % 7 // Monday start

  // Days with bookings this month
  const bookedDays = new Set<number>()
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const d = new Date(b.start_time)
    if (d.getMonth() === viewMonth.month && d.getFullYear() === viewMonth.year) {
      bookedDays.add(d.getDate())
    }
  }

  const todayObj = new Date()
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth()+1).padStart(2,'0')}-${String(todayObj.getDate()).padStart(2,'0')}`

  const cells: Array<number | null> = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function dayStr(day: number) {
    return `${viewMonth.year}-${String(viewMonth.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function prevMonth() {
    setViewMonth(v => v.month === 0 ? { month: 11, year: v.year - 1 } : { month: v.month - 1, year: v.year })
  }
  function nextMonth() {
    setViewMonth(v => v.month === 11 ? { month: 0, year: v.year + 1 } : { month: v.month + 1, year: v.year })
  }

  // Bookings for selected date
  const dayBookings = bookings.filter(b => {
    const d = new Date(b.start_time)
    const local = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return local === selectedDate && b.status !== 'cancelled'
  })

  const byRoom: Record<string, Booking[]> = {}
  dayBookings.forEach(b => {
    const r = b.rooms?.name || '?'
    if (!byRoom[r]) byRoom[r] = []
    byRoom[r].push(b)
  })
  Object.values(byRoom).forEach(arr => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)))

  const activeRooms = ROOMS_ORDER.filter(r => byRoom[r])
  const unknownRooms = Object.keys(byRoom).filter(r => !ROOMS_ORDER.includes(r))
  const allRooms = [...activeRooms, ...unknownRooms]

  const selectedDayObj = new Date(selectedDate + 'T12:00:00')
  const dateLabel = selectedDayObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="w-64 shrink-0 rounded-2xl flex flex-col overflow-hidden"
      style={{
        maxHeight: 'calc(100vh - 180px)',
        background: '#fff',
        border: '1.5px solid #e8edf2',
        boxShadow: '0 4px 20px rgba(10,39,68,0.08)',
      }}>

      {/* Mini calendario */}
      <div className="p-3" style={{ borderBottom: '1px solid #f0f4f8' }}>
        {/* Header mes */}
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            style={{ background: '#f8fafc' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <button
            onClick={() => {
              const now = new Date()
              setViewMonth({ month: now.getMonth(), year: now.getFullYear() })
            }}
            className="text-xs font-bold tracking-wide capitalize transition-colors"
            style={{ color: '#0a2744' }}
          >
            {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
          </button>

          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            style={{ background: '#f8fafc' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Días semana */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold" style={{ color: '#94a3b8' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid días */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />
            const ds = dayStr(day)
            const isSelected = ds === selectedDate
            const isToday = ds === todayStr
            const hasBookings = bookedDays.has(day)

            return (
              <button
                key={day}
                onClick={() => onDateChange(ds)}
                className="relative flex flex-col items-center justify-center h-7 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: isSelected ? '#0a2744' : isToday ? '#f0f9ff' : 'transparent',
                  color: isSelected ? '#c5e84a' : isToday ? '#0a2744' : '#374151',
                  fontWeight: isSelected || isToday ? 700 : 500,
                  boxShadow: isSelected ? '0 2px 8px rgba(10,39,68,0.25)' : 'none',
                }}
              >
                {day}
                {hasBookings && !isSelected && (
                  <span
                    className="absolute bottom-0.5 left-1/2 w-1 h-1 rounded-full"
                    style={{ background: isToday ? '#0a2744' : '#c5e84a', transform: 'translateX(-50%)' }}
                  />
                )}
                {hasBookings && isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-white/50" style={{ transform: 'translateX(-50%)' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Título agenda */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid #f0f4f8' }}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#0a2744' }}>Agenda</p>
          <p className="text-[10px] text-gray-400 capitalize mt-0.5">{dateLabel}</p>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: dayBookings.length > 0 ? '#0a2744' : '#f1f5f9', color: dayBookings.length > 0 ? '#c5e84a' : '#94a3b8' }}
        >
          {dayBookings.length} reservas
        </span>
      </div>

      {/* Lista de reservas */}
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {dayBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-xs font-medium">Sin reservas este día</p>
            <p className="text-[10px] mt-1 text-gray-300">Seleccioná otro día en el calendario</p>
          </div>
        ) : (
          allRooms.map(roomName => {
            const color = ROOM_COLORS[roomName] || '#616161'
            const textDark = ['#F6BF26', '#E67C73'].includes(color)
            const roomBookings = byRoom[roomName]

            return (
              <div key={roomName} className="rounded-xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
                <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: color }}>
                  <p className="text-[11px] font-bold" style={{ color: textDark ? '#000' : '#fff' }}>
                    {roomName}
                  </p>
                  <span className="text-[10px] ml-auto" style={{ color: textDark ? '#00000099' : '#ffffff99' }}>
                    {roomBookings.length} reserva{roomBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div>
                  {roomBookings.map((b, idx) => {
                    const bufferStart = addMin(b.start_time, -30)
                    const bufferEnd = addMin(b.end_time, 30)
                    const prevEnd = idx > 0 ? roomBookings[idx - 1].end_time : null
                    const showBufBefore = !prevEnd || new Date(bufferStart) >= new Date(prevEnd)

                    return (
                      <div key={b.id}>
                        {showBufBefore && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: '#fffbf0' }}>
                            <div className="w-0.5 self-stretch bg-amber-200 rounded" />
                            <span className="text-[10px] text-amber-400 leading-tight">
                              ⏱ {fmt(bufferStart)} · margen
                            </span>
                          </div>
                        )}

                        <div className="px-2.5 py-2 bg-white" style={{ borderLeft: `3px solid ${color}` }}>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-gray-800 leading-tight">
                              {fmt(b.start_time)} → {fmt(b.end_time)}
                            </span>
                            {b.status === 'pending' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white shrink-0"
                                style={{ background: '#F9A825' }}>
                                Pend.
                              </span>
                            )}
                          </div>
                          {isAdmin && b.user_name && (
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{b.user_name}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: '#fffbf0' }}>
                          <div className="w-0.5 self-stretch bg-amber-200 rounded" />
                          <span className="text-[10px] text-amber-400 leading-tight">
                            hasta {fmt(bufferEnd)} · margen
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {dayBookings.length > 0 && (
        <div className="px-3 py-2" style={{ borderTop: '1px solid #f0f4f8' }}>
          <p className="text-[10px] text-gray-300 text-center">🟠 30 min de margen entre reservas</p>
        </div>
      )}
    </div>
  )
}
