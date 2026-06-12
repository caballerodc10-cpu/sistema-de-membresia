'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Room } from '@/types'

type Props = {
  initialDate?: string
  onClose: () => void
  onSaved: () => void
}

// Precios reales por sala y duración — Lista de precios Mayo 2026
// Todos los valores son SIN IVA (precio base)
const PRECIOS_SALA: Record<string, Record<number, number>> = {
  // Alocasia — 1 a 3 personas — mínimo 2hs — $6.900/hs
  'Alocasia': {
    1: 6900,  2: 13000, 3: 19300, 4: 25400, 5: 31400,
    6: 37400, 7: 43100, 8: 48700, 9: 54300,
  },
  // Begonia — mismos precios que Pothus 2 (3 a 5 personas) — $10.100/hs
  'Begonia': {
    1: 10100, 2: 19500, 3: 28800, 4: 38200, 5: 47300,
    6: 56200, 7: 64800, 8: 73600, 9: 82000,
  },
  // Pothus 2 — 3 a 5 personas — mínimo 2hs — $10.100/hs
  'Pothus 2': {
    1: 10100, 2: 19500, 3: 28800, 4: 38200, 5: 47300,
    6: 56200, 7: 64800, 8: 73600, 9: 82000,
  },
  // Peperomia — 6 a 8 personas — mínimo 2hs — $12.800/hs
  'Peperomia': {
    1: 12800, 2: 24300, 3: 36400, 4: 47600, 5: 59000,
    6: 70200, 7: 81100, 8: 91100, 9: 102300,
  },
  // Calathea — 10 a 12 personas — mínimo 2hs — $19.300/hs
  'Calathea': {
    1: 19300, 2: 36500, 3: 54200, 4: 71700, 5: 88800,
    6: 105700, 7: 122100, 8: 138200, 9: 154300,
  },
  // Pothus (Reuniones) — 15 a 20 personas — mínimo 2hs — $28.900/hs
  'Pothus': {
    1: 28900, 2: 55300, 3: 82100, 4: 108600, 5: 134200,
    6: 159600, 7: 184600, 8: 208900, 9: 233100,
  },
  // Bromelia — SUM 20 a 30 personas — mínimo 2hs — $40.300/hs
  'Bromelia': {
    1: 40300, 2: 76700,  3: 114000, 4: 150500, 5: 186500,
    6: 221700, 7: 256300, 8: 290300, 9: 323500,
  },
  // Pandurata — Espacio flexible compartido — precio por persona
  // Jornada parcial 5hs=$14.500 / Jornada completa 9hs=$25.000
  'Pandurata': {
    1: 2900, 2: 5800, 3: 8700, 4: 11600, 5: 14500,
    6: 17000, 7: 19500, 8: 22000, 9: 25000,
  },
}

// Salas compartidas (aplican descuentos menores en convenios)
const SALAS_COMPARTIDAS = ['Pandurata']

// Colores por sala
const ROOM_COLORS: Record<string, string> = {
  'Alocasia': '#E67C73',
  'Begonia': '#0B8043',
  'Pothus 2': '#33B679',
  'Pandurata': '#7986CB',
  'Peperomia': '#F6BF26',
  'Calathea': '#3F51B5',
  'Pothus': '#F4511E',
  'Bromelia': '#039BE5',
}

function getPrecioSala(roomName: string, horas: number): number {
  const tabla = PRECIOS_SALA[roomName]
  if (!tabla) return 0
  const h = Math.round(horas)
  if (tabla[h]) return tabla[h]
  if (h <= 0) return 0
  // Para más de 9hs: extrapolamos con precio por hora de la sala
  const precio9 = tabla[9] || tabla[8] || 0
  const precio8 = tabla[8] || tabla[9] || 0
  const precioPorHoraExtra = precio9 - precio8
  return Math.round(precio9 + (h - 9) * precioPorHoraExtra)
}

// Descuentos por convenio: { compartida, privada }
const DESCUENTOS_CONVENIO: Record<string, { compartida: number; privada: number }> = {
  externo:          { compartida: 0,  privada: 0  },
  miembro:          { compartida: 0,  privada: 0  },
  abogado_colegio:  { compartida: 0,  privada: 0  }, // lógica especial: sin IVA
  cpce_contador:    { compartida: 10, privada: 15 }, // CPCE Ciencias Económicas
  oam:              { compartida: 15, privada: 15 }, // OAM Corrientes
  almacen_idiomas:  { compartida: 0,  privada: 20 }, // Almacén de Idiomas
  unne:             { compartida: 0,  privada: 15 }, // UNNe
  convenio_otro:    { compartida: 10, privada: 10 },
}

type Miembro = {
  id: string
  user_name: string
  plan: string
  hours_total: number
  hours_used: number
}

type PoolColegio = {
  id: string
  hours_total: number
  hours_used: number
}

function getWeekBounds(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0=Dom, 1=Lun...
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 7)
  return { from: mon.toISOString(), to: sun.toISOString() }
}

export default function BookingModal({ initialDate, onClose, onSaved }: Props) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [poolColegio, setPoolColegio] = useState<PoolColegio | null>(null)
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [notes, setNotes] = useState('')
  const [tipoCliente, setTipoCliente] = useState('externo')
  const [medioPago, setMedioPago] = useState('efectivo')
  const [clienteNombre, setClienteNombre] = useState('')
  const [miembroSeleccionado, setMiembroSeleccionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRoomPicker, setShowRoomPicker] = useState(false)

  // Estado para abogados del Colegio
  const [usosSemana, setUsosSemana] = useState<number | null>(null)
  const [checkingUsos, setCheckingUsos] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const [{ data: roomsData }, { data: memsData }, { data: poolData }] = await Promise.all([
        supabase.from('rooms').select('*').order('name'),
        supabase.from('memberships').select('id, user_name, plan, hours_total, hours_used').order('user_name'),
        supabase.from('memberships').select('id, hours_total, hours_used').eq('plan', 'Colegio de Abogados').maybeSingle(),
      ])
      setRooms(roomsData || [])
      if (roomsData && roomsData.length > 0) setRoomId(roomsData[0].id)
      setMiembros(memsData || [])
      if (poolData) setPoolColegio(poolData)
    }
    loadData()
  }, [])

  // ¿Es miembro con membresía de horas?
  const membresia = miembros.find(m => m.id === miembroSeleccionado)
  const esMiembro = !!membresia && membresia.hours_total > 0
  const esAbogadoColegio = tipoCliente === 'abogado_colegio'

  // Auto-asignar sala según plan de membresía
  useEffect(() => {
    if (!membresia || rooms.length === 0) return
    const salaAsignada = rooms.find(r => r.name.toLowerCase() === membresia.plan.toLowerCase())
    if (salaAsignada) setRoomId(salaAsignada.id)
  }, [miembroSeleccionado, rooms])

  // Auto-asignar Alocasia para abogados del Colegio
  useEffect(() => {
    if (!esAbogadoColegio || rooms.length === 0) return
    const alocasia = rooms.find(r => r.name === 'Alocasia')
    if (alocasia) setRoomId(alocasia.id)
    // Solo efectivo o transferencia para abogados del Colegio
    if (!['efectivo', 'transferencia'].includes(medioPago)) setMedioPago('efectivo')
  }, [esAbogadoColegio, rooms])

  // Verificar usos de la semana para abogados del Colegio
  useEffect(() => {
    if (!esAbogadoColegio || !clienteNombre.trim() || !date || rooms.length === 0) {
      setUsosSemana(null)
      return
    }
    setCheckingUsos(true)
    const timer = setTimeout(async () => {
      const alocasia = rooms.find(r => r.name === 'Alocasia')
      if (!alocasia) { setCheckingUsos(false); return }
      const { from, to } = getWeekBounds(date)
      const supabase = createClient()
      const { data } = await supabase
        .from('bookings')
        .select('id')
        .ilike('user_name', clienteNombre.trim())
        .eq('room_id', alocasia.id)
        .in('status', ['confirmed', 'pending'])
        .gte('start_time', from)
        .lt('start_time', to)
      setUsosSemana((data || []).length)
      setCheckingUsos(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [esAbogadoColegio, clienteNombre, date, rooms])

  // Calcular horas y precio
  const startH = parseInt(startTime.split(':')[0])
  const endH = parseInt(endTime.split(':')[0])
  const startM = parseInt(startTime.split(':')[1])
  const endM = parseInt(endTime.split(':')[1])
  const duracionHoras = Math.max(0, (endH * 60 + endM - startH * 60 - startM) / 60)

  // Horas de membresía
  const horasDisponibles = membresia ? Math.max(0, membresia.hours_total - membresia.hours_used) : 0
  const horasPostReserva = Math.max(0, horasDisponibles - duracionHoras)
  const horasSinCupo = duracionHoras > horasDisponibles

  // Pool del Colegio
  const horasPoolDisp = poolColegio ? Math.max(0, poolColegio.hours_total - poolColegio.hours_used) : 0
  const poolAgotado = esAbogadoColegio && poolColegio && horasPoolDisp <= 0

  // ¿Es la primera vez en la semana? → gratis
  const esGratis = esAbogadoColegio && usosSemana === 0 && !poolAgotado

  // Precio para externos y convenios
  const selectedRoom = rooms.find(r => r.id === roomId)
  const roomName = selectedRoom?.name || ''
  const esCompartida = SALAS_COMPARTIDAS.includes(roomName)
  const precioBase = selectedRoom ? getPrecioSala(roomName, duracionHoras) : 0

  // Abogados del Colegio: NUNCA tienen IVA
  const conIva = !esAbogadoColegio && medioPago !== 'efectivo'
  const esTarjetaCredito = !esAbogadoColegio && medioPago === 'tarjeta_credito'

  const convenio = DESCUENTOS_CONVENIO[tipoCliente] || { compartida: 0, privada: 0 }
  const descuento = esCompartida ? convenio.compartida : convenio.privada
  const precioConDescuento = precioBase * (1 - descuento / 100)
  const iva = conIva ? precioConDescuento * 0.21 : 0
  const recargoTarjeta = esTarjetaCredito ? (precioConDescuento + iva) * 0.15 : 0

  // Precio final
  let precioTotal = 0
  if (esMiembro) {
    precioTotal = 0
  } else if (esAbogadoColegio) {
    precioTotal = esGratis ? 0 : precioBase // sin IVA, sin descuento adicional
  } else {
    precioTotal = precioConDescuento + iva + recargoTarjeta
  }
  const sena = precioTotal * 0.5

  const esSabado = new Date(date + 'T12:00:00').getDay() === 6

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (duracionHoras < 1) {
      setError('La duración debe ser de al menos 1 hora')
      setLoading(false)
      return
    }
    if (endTime <= startTime) {
      setError('La hora de fin debe ser posterior a la hora de inicio')
      setLoading(false)
      return
    }
    if (esMiembro && horasSinCupo) {
      setError(`El miembro solo tiene ${horasDisponibles}hs disponibles. Esta reserva requiere ${duracionHoras}hs.`)
      setLoading(false)
      return
    }

    const nombreFinal = membresia?.user_name || clienteNombre.trim()
    if (!nombreFinal) {
      setError('Ingresá el nombre del cliente')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado'); setLoading(false); return }

    const startTimestamp = `${date}T${startTime}:00`
    const endTimestamp = `${date}T${endTime}:00`

    // Verificar solapamiento con buffer de 30 minutos
    const BUFFER_MIN = 30
    const startConBuffer = new Date(new Date(startTimestamp).getTime() - BUFFER_MIN * 60000).toISOString()
    const endConBuffer = new Date(new Date(endTimestamp).getTime() + BUFFER_MIN * 60000).toISOString()

    const { data: existing } = await supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .lt('start_time', endConBuffer)
      .gt('end_time', startConBuffer)

    if (existing && existing.length > 0) {
      const ocupada = existing[0]
      const horaFin = new Date(ocupada.end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      const horaInicio = new Date(ocupada.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      setError(`La sala ya está ocupada o necesita 30 min de margen. Reserva existente: ${horaInicio} – ${horaFin}`)
      setLoading(false)
      return
    }

    const medioPagoFinal = esAbogadoColegio
      ? medioPago
      : esMiembro ? 'membresia' : medioPago

    const { error: insertError } = await supabase.from('bookings').insert({
      user_id: user.id,
      room_id: roomId,
      start_time: startTimestamp,
      end_time: endTimestamp,
      notes,
      status: 'confirmed',
      precio_total: Math.round(precioTotal),
      monto_sena: Math.round(sena),
      descuento_pct: descuento,
      recargo_tarjeta: esTarjetaCredito,
      con_iva: conIva,
      medio_pago: medioPagoFinal,
      es_sabado: esSabado,
      tipo_cliente: esMiembro ? 'miembro' : tipoCliente,
      user_name: nombreFinal,
    })

    if (insertError) {
      setError('Error al guardar la reserva')
      setLoading(false)
      return
    }

    // Si es miembro, descontar las horas usadas
    if (esMiembro && membresia) {
      await supabase
        .from('memberships')
        .update({ hours_used: membresia.hours_used + duracionHoras })
        .eq('id', membresia.id)
    }

    // Si es abogado del Colegio y es gratis, descontar del pool
    if (esAbogadoColegio && esGratis && poolColegio) {
      await supabase
        .from('memberships')
        .update({ hours_used: poolColegio.hours_used + duracionHoras })
        .eq('id', poolColegio.id)
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold" style={{ color: '#0a2744' }}>Nueva reserva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente / Miembro</label>
            <select
              value={miembroSeleccionado}
              onChange={e => {
                setMiembroSeleccionado(e.target.value)
                if (e.target.value) setClienteNombre('')
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900 mb-2"
            >
              <option value="">— Seleccioná un miembro —</option>
              {miembros.map(m => (
                <option key={m.id} value={m.id}>
                  {m.user_name} · {m.plan}
                  {m.hours_total > 0 ? ` · ${Math.max(0, m.hours_total - m.hours_used)}hs disp.` : ''}
                </option>
              ))}
            </select>
            {!miembroSeleccionado && (
              <input
                type="text"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                placeholder="O escribí el nombre del cliente externo"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900"
              />
            )}
          </div>

          {/* Sala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
            {esMiembro ? (
              <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm flex items-center gap-2">
                <span className="text-base">🏢</span>
                <span className="font-medium">{selectedRoom?.name}</span>
                <span className="text-gray-400 text-xs ml-1">— asignada por membresía</span>
              </div>
            ) : esAbogadoColegio ? (
              <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm flex items-center gap-2">
                <span className="text-base">⚖️</span>
                <span className="font-medium">Alocasia</span>
                <span className="text-gray-400 text-xs ml-1">— sala del Colegio de Abogados</span>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowRoomPicker(v => !v)}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {selectedRoom && (
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: ROOM_COLORS[selectedRoom.name] || '#999' }} />
                      )}
                      <span className="text-gray-900 text-sm font-medium">
                        {selectedRoom ? `${selectedRoom.name} — hasta ${selectedRoom.capacity} personas` : 'Seleccioná una sala'}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">{showRoomPicker ? '▲' : '▼'}</span>
                  </button>
                  {showRoomPicker && (
                    <div className="border-t border-gray-100 max-h-56 overflow-y-auto bg-white">
                      {rooms.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setRoomId(r.id); setShowRoomPicker(false) }}
                          className={`w-full px-3 py-2.5 flex items-center gap-3 text-left text-sm transition-colors hover:bg-gray-50 ${r.id === roomId ? 'bg-blue-50' : ''}`}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: ROOM_COLORS[r.name] || '#999' }} />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${r.id === roomId ? 'text-blue-700' : 'text-gray-900'}`}>{r.name}</p>
                            <p className="text-xs text-gray-400">hasta {r.capacity} personas</p>
                          </div>
                          {r.id === roomId && <span className="text-blue-500 text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
            )}
          </div>

          {/* Fecha y horario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900" />
            {esSabado && (
              <p className="text-amber-600 text-xs mt-1">⚠ Sábado: recordá coordinar el horario."grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required
                min="07:00" max="21:00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required
                min="07:00" max="21:00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900" />
            </div>
          </div>

          {/* Tipo y medio de pago — solo para externos y abogados del Colegio */}
          {!esMiembro && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cliente</label>
                <select value={tipoCliente} onChange={e => setTipoCliente(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900">
                  <option value="externo">Externo (sin convenio)</option>
                  <option value="miembro">Miembro cowork</option>
                  <option value="abogado_colegio">⚖️ CAC — Colegio de Abogados (1hs gratis/sem · sin IVA)</option>
                  <option value="cpce_contador">📊 CPCE — Ciencias Económicas (10% comp · 15% priv)</option>
                  <option value="oam">🏛 OAM Corrientes (15% en todas)</option>
                  <option value="almacen_idiomas">🌐 Almacén de Idiomas (20% solo privadas)</option>
                  <option value="unne">🎓 UNNe (15% solo privadas)</option>
                  <option value="convenio_otro">Otro convenio (10% en todas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medio de pago</label>
                <select value={medioPago} onChange={e => setMedioPago(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia (Banco Patagonia)</option>
                  {!esAbogadoColegio && <>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="tarjeta_debito">Tarjeta de débito</option>
                    <option value="tarjeta_credito">Tarjeta de crédito (+15%)</option>
                    <option value="link">Link de pagos</option>
                  </>}
                </select>
                {esAbogadoColegio && (
                  <p className="text-xs text-gray-400 mt-1">Solo efectivo o transferencia para el Colegio de Abogados</p>
                )}
              </div>
            </>
          )}

          {/* Panel especial abogados del Colegio */}
          {esAbogadoColegio && clienteNombre.trim().length > 0 && (
            <div className="rounded-xl p-4 text-sm space-y-2 border" style={{ background: '#f0f4ff', borderColor: '#0a274433' }}>
              <div className="flex items-center justify-between">
                <p className="font-semibold" style={{ color: '#0a2744' }}>⚖️ Colegio de Abogados</p>
                {poolColegio && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${horasPoolDisp > 10 ? 'bg-green-100 text-green-700' : horasPoolDisp > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                    Pool: {horasPoolDisp}hs disponibles
                  </span>
                )}
                {!poolColegio && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Sin pool configurado</span>
                )}
              </div>

              {checkingUsos ? (
                <p className="text-gray-400 text-xs">Verificando uso de la semana...</p>
              ) : usosSemana !== null && (
                <>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Reservas esta semana</span>
                    <span className="font-medium">{usosSemana} vez{usosSemana !== 1 ? 'es' : ''}</span>
                  </div>
                  {duracionHoras > 0 && (
                    <div className={`flex items-center justify-between font-bold pt-2 border-t ${esGratis ? 'text-green-700 border-green-200' : 'text-orange-700 border-orange-200'}`}>
                      <span>{esGratis ? '✅ Hora gratuita (1ª vez esta semana)' : '💰 Cobrar — ya usó su hora gratis'}</span>
                      <span>{esGratis ? 'Gratis' : `$${precioBase.toLocaleString('es-AR')}`}</span>
                    </div>
                  )}
                  {!esGratis && usosSemana !== null && usosSemana > 0 && (
                    <p className="text-xs text-gray-400">Precio sin IVA · {medioPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>
                  )}
                  {poolAgotado && (
                    <p className="text-xs text-red-500 font-medium">⚠ Pool mensual agotado — la hora no es gratuita este mes</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Resumen horas — miembro con membresía */}
          {esMiembro && duracionHoras > 0 && (
            <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: horasSinCupo ? '#fff5f5' : '#f0fdf4', border: `1px solid ${horasSinCupo ? '#fca5a5' : '#86efac'}` }}>
              <p className="font-semibold" style={{ color: '#0a2744' }}>
                Membresía · {membresia?.plan}
              </p>
              <div className="flex justify-between text-gray-600">
                <span>Horas disponibles</span>
                <span className="font-medium">{horasDisponibles}hs</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Esta reserva</span>
                <span className="font-medium text-orange-600">−{duracionHoras}hs</span>
              </div>
              <div className={`flex justify-between font-bold border-t pt-2 ${horasSinCupo ? 'text-red-600' : 'text-green-700'}`}>
                <span>Quedan después</span>
                <span>{horasSinCupo ? '⚠ Sin cupo' : `${horasPostReserva}hs`}</span>
              </div>
            </div>
          )}

          {/* Resumen precio — cliente externo / convenio */}
          {!esMiembro && !esAbogadoColegio && (clienteNombre.trim().length > 0) && duracionHoras >= 1 && precioBase > 0 && (
            <div className="rounded-xl p-4 text-sm space-y-1" style={{ background: '#f0f7ff', border: '1px solid #0a274422' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold" style={{ color: '#0a2744' }}>
                  {duracionHoras}hs · {selectedRoom?.name}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${esCompartida ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {esCompartida ? 'Compartida' : 'Privada'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Precio de lista{esCompartida ? ' (por persona)' : ''}</span>
                <span>${precioBase.toLocaleString('es-AR')}</span>
              </div>
              {esCompartida && (
                <p className="text-xs text-blue-500">Jornada parcial 5hs = $14.500 · Completa 9hs = $25.000</p>
              )}
              {descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento convenio {descuento}%</span>
                  <span>-${Math.round(precioBase * descuento / 100).toLocaleString('es-AR')}</span>
                </div>
              )}
              {conIva && (
                <div className="flex justify-between text-gray-600">
                  <span>IVA 21%</span><span>+${Math.round(iva).toLocaleString('es-AR')}</span>
                </div>
              )}
              {recargoTarjeta > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Recargo tarjeta 15%</span>
                  <span>+${Math.round(recargoTarjeta).toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2" style={{ color: '#0a2744' }}>
                <span>Total</span><span>${Math.round(precioTotal).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Seña (50%)</span><span>${Math.round(sena).toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none resize-none text-gray-900"
              placeholder="Ej: necesita proyector, viene con 3 personas..." />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || (esMiembro && horasSinCupo) || (esAbogadoColegio && checkingUsos)}
              className="flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ background: '#0a2744' }}>
              {loading ? 'Guardando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
