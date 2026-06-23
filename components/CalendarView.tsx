'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import BookingModal from '@/components/BookingModal'
import BookingDetailModal from '@/components/BookingDetailModal'
import ClientRequestModal from '@/components/ClientRequestModal'

// ── Colores de salas ─────────────────────────────────────────────────────────
const ROOM_COLORS: Record<string, string> = {
  'Alocasia': '#E67C73', 'Begonia': '#0B8043', 'Pothus 2': '#33B679',
  'Pandurata': '#7986CB', 'Peperomia': '#F6BF26', 'Calathea': '#3F51B5',
  'Pothus': '#F4511E', 'Bromelia': '#039BE5',
}
const SALA_NAMES = Object.keys(ROOM_COLORS)
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 07:00 – 20:00

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}
function pad(n: number) { return n.toString().padStart(2, '0') }
function fmtHora(s: string) {
  const d = new Date(s)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Partículas (Highlighter) ─────────────────────────────────────────────────
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return pos
}

function Particles({ color = '#c5e84a', quantity = 40 }: { color?: string; quantity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouse = useMousePosition()
  const circles = useRef<any[]>([])
  const animRef = useRef<number>(0)

  function hexToRgb(hex: string) {
    hex = hex.replace('#', '')
    const n = parseInt(hex, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb = hexToRgb(color)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const w = container!.offsetWidth
      const h = container!.offsetHeight
      canvas!.width = w * dpr; canvas!.height = h * dpr
      canvas!.style.width = w + 'px'; canvas!.style.height = h + 'px'
      ctx.scale(dpr, dpr)
      circles.current = []
      for (let i = 0; i < quantity; i++) {
        circles.current.push({
          x: Math.random() * w, y: Math.random() * h,
          tx: 0, ty: 0,
          size: Math.random() * 2 + 1,
          alpha: 0, targetAlpha: Math.random() * 0.3 + 0.1,
          dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
          mag: 0.1 + Math.random() * 4
        })
      }
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      const W = container!.offsetWidth, H = container!.offsetHeight
      const rect = canvas!.getBoundingClientRect()
      const mx = mouse.x - rect.left - W / 2
      const my = mouse.y - rect.top - H / 2
      ctx.clearRect(0, 0, W, H)
      circles.current.forEach((c, i) => {
        c.tx += (mx / (50 / c.mag) - c.tx) / 50
        c.ty += (my / (50 / c.mag) - c.ty) / 50
        c.x += c.dx; c.y += c.dy
        if (c.x < 0 || c.x > W || c.y < 0 || c.y > H) {
          circles.current[i] = { ...c, x: Math.random() * W, y: Math.random() * H, tx: 0, ty: 0 }
          return
        }
        c.alpha = Math.min(c.alpha + 0.02, c.targetAlpha)
        ctx.beginPath()
        ctx.arc(c.x + c.tx, c.y + c.ty, c.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb.join(',')},${c.alpha})`
        ctx.fill()
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current) }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} />
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function CalendarView({ isAdmin }: { isAdmin: boolean }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [today] = useState(() => new Date())
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateStr(today))
  const [showNewModal, setShowNewModal] = useState(false)
  const [newModalDate, setNewModalDate] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [clientModal, setClientModal] = useState<{ date: string; time?: string } | null>(null)
  const [highlightDay, setHighlightDay] = useState<number | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data } = await supabase
      .from('bookings').select('*, rooms(name)')
      .in('status', ['confirmed', 'pending', 'cancelled'])
    setBookings(data || [])
    setLoading(false)
  }

  // Días del mes
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstDow = (new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay() + 6) % 7 // lunes=0
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7

  // Reservas del día seleccionado
  const dayBookings = bookings.filter(b => {
    const d = new Date(b.start_time)
    return toDateStr(d) === selectedDate && (isAdmin || b.status === 'confirmed')
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  // Conteo de reservas por día para el mini-calendario
  const bookingsByDay: Record<string, number> = {}
  bookings.forEach(b => {
    if (b.status === 'cancelled') return
    const d = toDateStr(new Date(b.start_time))
    bookingsByDay[d] = (bookingsByDay[d] || 0) + 1
  })

  function prevMonth() { setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }
  function goToday() {
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(toDateStr(today))
  }

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAY_NAMES = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']

  // Salas ocupadas en una hora específica del día seleccionado
  function getRoomsAtHour(hour: number) {
    return dayBookings.filter(b => {
      const start = new Date(b.start_time).getHours()
      const end = new Date(b.end_time).getHours() + (new Date(b.end_time).getMinutes() > 0 ? 1 : 0)
      return hour >= start && hour < end
    })
  }

  const selectedDt = new Date(selectedDate + 'T12:00:00')
  const selectedLabel = `${selectedDt.getDate()} de ${MONTH_NAMES[selectedDt.getMonth()]} ${selectedDt.getFullYear()}`

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#0a2744' }}>
            {isAdmin ? 'Calendario de Reservas' : 'Disponibilidad de Salas'}
          </h1>
          {!isAdmin && <p className="text-xs text-gray-500 mt-0.5">Seleccioná un día para ver disponibilidad</p>}
        </div>
        {isAdmin && (
          <button onClick={() => { setNewModalDate(''); setShowNewModal(true) }}
            className="w-full sm:w-auto text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            style={{ background: '#0a2744' }}>
            + Nueva reserva
          </button>
        )}
      </div>

      {/* Layout principal */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── Mini calendario mensual ── */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="relative overflow-hidden rounded-2xl border border-white/10"
            style={{ background: 'linear-gradient(135deg, #0a2744 0%, #1a3f6f 100%)' }}>
            <Particles color="#c5e84a" quantity={35} />
            <div className="relative z-10 p-4">
              {/* Nav del mes */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  ‹
                </button>
                <div className="text-center">
                  <p className="text-white font-bold text-sm">{MONTH_NAMES[viewMonth.getMonth()]}</p>
                  <p className="text-white/50 text-xs">{viewMonth.getFullYear()}</p>
                </div>
                <button onClick={nextMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  ›
                </button>
              </div>

              {/* Cabecera días */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-white/40 py-1">{d}</div>
                ))}
              </div>

              {/* Grilla de días */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - firstDow + 1
                  if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />
                  const dateStr = `${viewMonth.getFullYear()}-${pad(viewMonth.getMonth() + 1)}-${pad(dayNum)}`
                  const isToday = dateStr === toDateStr(today)
                  const isSelected = dateStr === selectedDate
                  const count = bookingsByDay[dateStr] || 0
                  const isHighlighted = highlightDay === dayNum

                  return (
                    <button key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      onMouseEnter={() => setHighlightDay(dayNum)}
                      onMouseLeave={() => setHighlightDay(null)}
                      className="relative flex flex-col items-center justify-center rounded-lg py-1 transition-all duration-200 group"
                      style={{
                        background: isSelected ? '#c5e84a' : isHighlighted ? 'rgba(197,232,74,0.12)' : 'transparent',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isSelected ? '0 0 16px rgba(197,232,74,0.4)' : 'none',
                      }}>
                      <span className="text-xs font-semibold leading-none"
                        style={{ color: isSelected ? '#0a2744' : isToday ? '#c5e84a' : 'rgba(255,255,255,0.85)' }}>
                        {dayNum}
                      </span>
                      {count > 0 && (
                        <span className="mt-0.5 w-1 h-1 rounded-full"
                          style={{ background: isSelected ? '#0a2744' : '#c5e84a', opacity: isSelected ? 1 : 0.8 }} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Botón hoy */}
              <button onClick={goToday}
                className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: 'rgba(197,232,74,0.15)', color: '#c5e84a', border: '1px solid rgba(197,232,74,0.2)' }}>
                Hoy
              </button>

              {/* Leyenda de salas */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-white/40 mb-2 font-medium">Salas</p>
                <div className="flex flex-wrap gap-1.5">
                  {SALA_NAMES.map(sala => (
                    <span key={sala}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: ROOM_COLORS[sala] + '33', color: ROOM_COLORS[sala], border: `1px solid ${ROOM_COLORS[sala]}55` }}>
                      {sala}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Agenda del día ── */}
        <div className="flex-1 min-w-0">
          {/* Header del día */}
          <div className="rounded-2xl mb-3 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            style={{ background: 'linear-gradient(135deg, #0a2744 0%, #1a3f6f 100%)' }}>
            <div>
              <p className="text-white font-bold text-base">{selectedLabel}</p>
              <p className="text-white/50 text-xs mt-0.5">
                {dayBookings.length === 0 ? 'Sin reservas — todo disponible' : `${dayBookings.length} reserva${dayBookings.length > 1 ? 's' : ''}`}
              </p>
            </div>
            {!isAdmin && (
              <button onClick={() => setClientModal({ date: selectedDate })}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{ background: '#c5e84a', color: '#0a2744' }}>
                + Solicitar turno
              </button>
            )}
            {isAdmin && (
              <button onClick={() => { setNewModalDate(selectedDate); setShowNewModal(true) }}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                style={{ background: '#c5e84a', color: '#0a2744' }}>
                + Agregar reserva
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando...</div>
          ) : (
            <div className="rounded-2xl overflow-hidden border"
              style={{ borderColor: 'rgba(10,39,68,0.1)', background: '#fff' }}>
              {/* Tabla de horas */}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: 320 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 w-16">Hora</th>
                      {SALA_NAMES.map(sala => (
                        <th key={sala} className="text-center px-1 py-2 text-xs font-semibold" style={{ color: ROOM_COLORS[sala] }}>
                          <span className="hidden sm:inline">{sala}</span>
                          <span className="sm:hidden text-xs">{sala.substring(0, 3)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map(hour => {
                      const occupied = getRoomsAtHour(hour)
                      const occupiedNames = occupied.map(b => b.rooms?.name)
                      return (
                        <tr key={hour}
                          className="border-t cursor-pointer transition-colors hover:bg-lime-50/50 group"
                          style={{ borderColor: '#f1f5f9' }}
                          onClick={() => {
                            const time = `${pad(hour)}:00`
                            if (isAdmin) { setNewModalDate(selectedDate); setShowNewModal(true) }
                            else setClientModal({ date: selectedDate, time })
                          }}>
                          <td className="px-3 py-2.5 text-xs font-mono text-gray-400 whitespace-nowrap">
                            {pad(hour)}:00
                          </td>
                          {SALA_NAMES.map(sala => {
                            const booking = occupied.find(b => b.rooms?.name === sala)
                            const isOccupied = occupiedNames.includes(sala)
                            return (
                              <td key={sala} className="px-1 py-1.5 text-center">
                                {isOccupied && booking ? (
                                  <div className="rounded-md px-1 py-1 text-xs font-semibold leading-tight cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{
                                      background: ROOM_COLORS[sala] + '22',
                                      color: ROOM_COLORS[sala],
                                      border: `1px solid ${ROOM_COLORS[sala]}44`,
                                      fontSize: '10px'
                                    }}
                                    onClick={e => {
                                      e.stopPropagation()
                                      if (isAdmin) setSelectedBooking({
                                        id: booking.id,
                                        title: sala,
                                        roomName: sala,
                                        status: booking.status,
                                        start: booking.start_time,
                                        end: booking.end_time,
                                        precioTotal: booking.precio_total || 0,
                                        montoPagado: booking.monto_pagado || 0,
                                        montoSena: booking.monto_sena || 0,
                                        medioPago: booking.medio_pago || 'efectivo',
                                        tipoCliente: booking.tipo_cliente || 'externo',
                                        notas: booking.notes || '',
                                        userName: booking.user_name || '',
                                      })
                                    }}>
                                    <div className="hidden sm:block">{fmtHora(booking.start_time)}–{fmtHora(booking.end_time)}</div>
                                    <div className="sm:hidden">●</div>
                                    {isAdmin && booking.user_name && (
                                      <div className="hidden sm:block text-gray-500 font-normal truncate max-w-[80px]" style={{ fontSize: 9 }}>
                                        {booking.user_name}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: ROOM_COLORS[sala] + '0a', border: `1px dashed ${ROOM_COLORS[sala]}33` }}>
                                    <span style={{ color: ROOM_COLORS[sala], fontSize: 9, opacity: 0.6 }}>libre</span>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CTA WhatsApp para cliente */}
          {!isAdmin && (
            <div className="mt-3 rounded-xl p-3 flex items-center justify-between gap-3"
              style={{ background: '#0a2744' }}>
              <p className="text-white text-sm font-medium">¿Necesitás ayuda? Escribinos por WhatsApp</p>
              <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:opacity-90"
                style={{ background: '#25D366' }}>
                WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdated={() => { setSelectedBooking(null); loadData() }}
        />
      )}
      {showNewModal && (
        <BookingModal
          initialDate={newModalDate}
          onClose={() => setShowNewModal(false)}
          onSaved={() => { setShowNewModal(false); loadData() }}
        isAdmin={isAdmin}
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
