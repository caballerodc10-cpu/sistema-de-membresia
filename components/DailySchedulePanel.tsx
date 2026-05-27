'use client'

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

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col"
      style={{ maxHeight: 'calc(100vh - 180px)' }}>

      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-100 rounded-t-xl bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#0a2744' }}>Agenda del día</p>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
            {dayBookings.length} reservas
          </span>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1"
          style={{ '--tw-ring-color': '#0a2744' } as React.CSSProperties}
        />
        <p className="text-[10px] text-gray-400 mt-1 capitalize">{dateLabel}</p>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {dayBookings.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-xs">Sin reservas este día</p>
          </div>
        ) : (
          allRooms.map(roomName => {
            const color = ROOM_COLORS[roomName] || '#616161'
            const textDark = ['#F6BF26', '#E67C73'].includes(color)
            const roomBookings = byRoom[roomName]

            return (
              <div key={roomName} className="rounded-xl border border-gray-100 overflow-hidden">
                {/* Cabecera sala */}
                <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: color }}>
                  <p className="text-[11px] font-bold" style={{ color: textDark ? '#000' : '#fff' }}>
                    {roomName}
                  </p>
                  <span className="text-[10px] ml-auto" style={{ color: textDark ? '#00000099' : '#ffffff99' }}>
                    {roomBookings.length} reserva{roomBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Bloques de tiempo */}
                <div>
                  {roomBookings.map((b, idx) => {
                    const bufferStart = addMin(b.start_time, -30)
                    const bufferEnd = addMin(b.end_time, 30)
                    const prevEnd = idx > 0 ? roomBookings[idx - 1].end_time : null
                    // ¿El buffer anterior no solapa con la reserva previa?
                    const showBufBefore = !prevEnd || new Date(bufferStart) >= new Date(prevEnd)

                    return (
                      <div key={b.id}>
                        {/* Margen antes */}
                        {showBufBefore && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: '#fff8f0' }}>
                            <div className="w-0.5 self-stretch bg-orange-200 rounded" />
                            <span className="text-[10px] text-orange-400 leading-tight">
                              ⏱ {fmt(bufferStart)}<br />
                              <span className="text-orange-300">margen 30 min</span>
                            </span>
                          </div>
                        )}

                        {/* Reserva */}
                        <div className="px-2.5 py-2 bg-white" style={{ borderLeft: `3px solid ${color}` }}>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-gray-800 leading-tight">
                              {fmt(b.start_time)}<br />
                              <span className="text-gray-400 font-normal">↓</span><br />
                              {fmt(b.end_time)}
                            </span>
                            <div className="text-right">
                              {b.status === 'pending' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white"
                                  style={{ background: '#F9A825' }}>
                                  Pend.
                                </span>
                              )}
                            </div>
                          </div>
                          {isAdmin && b.user_name && (
                            <p className="text-[11px] text-gray-500 mt-1 truncate">{b.user_name}</p>
                          )}
                        </div>

                        {/* Margen después */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: '#fff8f0' }}>
                          <div className="w-0.5 self-stretch bg-orange-200 rounded" />
                          <span className="text-[10px] text-orange-400 leading-tight">
                            ⏱ hasta {fmt(bufferEnd)}<br />
                            <span className="text-orange-300">margen 30 min</span>
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

      {/* Footer — próxima disponible */}
      {dayBookings.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 rounded-b-xl bg-gray-50">
          <p className="text-[10px] text-gray-400 text-center">
            🟠 = margen 30 min entre reservas
          </p>
        </div>
      )}
    </div>
  )
}
