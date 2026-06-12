'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
    onClose: () => void
    onSaved: () => void
    initialDate?: string
    initialStartTime?: string
}

export default function ClientRequestModal({ onClose, onSaved, initialDate, initialStartTime }: Props) {
    const [userName, setUserName] = useState('')
    const [membresia, setMembresia] = useState<{ id: string; plan: string; hours_total: number; hours_used: number; room_id: string; room_name: string } | null>(null)
    const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0])
    const [startTime, setStartTime] = useState(initialStartTime || '09:00')
    const [endTime, setEndTime] = useState(() => {
          if (initialStartTime) {
                  const [h, m] = initialStartTime.split(':').map(Number)
                  const endH = Math.min(21, h + 2)
                  return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
          }
          return '11:00'
    })
    const [notes, setNotes] = useState('')
    const [servicios, setServicios] = useState<string[]>([])
    const [acompañantes, setAcompañantes] = useState<{ nombre: string; dni: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)
    const [disponibilidad, setDisponibilidad] = useState<'libre' | 'ocupado' | 'checking' | null>(null)
    const [conflictoMsg, setConflictoMsg] = useState('')

  // Detectar fin de semana según la fecha elegida
  const fechaElegida = new Date(date + 'T12:00:00')
    const esFinDeSemana = fechaElegida.getDay() === 0 || fechaElegida.getDay() === 6

  const SERVICIOS = [
    { id: 'agua', label: '💧 Agua / Bebidas' },
    { id: 'calefaccion', label: '🌡️ Calefacción / Aire' },
    { id: 'pizarra', label: '📋 Pizarra' },
    { id: 'proyector', label: '📽️ Proyector' },
      ]

  function toggleServicio(id: string) {
        setServicios(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function buildNotes(): string {
        const partes: string[] = []
              if (servicios.length > 0) {
                      const labels = servicios.map(id => SERVICIOS.find(s => s.id === id)?.label.replace(/^[^ ]+ /, '') || id)
                      partes.push(`Servicios solicitados: ${labels.join(', ')}`)
              }
        const filtrados = acompañantes.filter(a => a.nombre.trim())
        if (filtrados.length > 0) {
                const lista = filtrados.map(a => `${a.nombre.trim()}${a.dni.trim() ? ` (DNI: ${a.dni.trim()})` : ''}`).join(' · ')
                partes.push(`Acompañantes: ${lista}`)
        }
        if (notes.trim()) partes.push(notes.trim())
        return partes.join('\n')
  }

  useEffect(() => {
        async function loadData() {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

          const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', user.id)
                  .single()

          const fullName = profile?.full_name || ''
                setUserName(fullName || user.email || '')

          // 1º intento: buscar por user_id
          let mem: any = null
                const { data: memById } = await supabase
                  .from('memberships')
                  .select('id, plan, hours_total, hours_used')
                  .eq('user_id', user.id)
                  .maybeSingle()

          mem = memById

          // 2º intento: buscar por full_name si no se encontró por user_id
          if (!mem && fullName) {
                    const { data: memByName } = await supabase
                      .from('memberships')
                      .select('id, plan, hours_total, hours_used')
                      .eq('user_name', fullName)
                      .maybeSingle()
                    mem = memByName
          }

          if (mem) {
                    // Buscar la sala que corresponde al plan
                  const { data: room } = await supabase
                      .from('rooms')
                      .select('id, name')
                      .ilike('name', mem.plan)
                      .single()

                  setMembresia({
                              ...mem,
                              room_id: room?.id || '',
                              room_name: room?.name || mem.plan,
                  })
          }

          setLoading(false)
        }
        loadData()
  }, [])

  // Verificación de disponibilidad en tiempo real
  useEffect(() => {
        if (!membresia?.room_id || !date || !startTime || !endTime) {
                setDisponibilidad(null)
                return
        }
        if (endTime <= startTime) {
                setDisponibilidad(null)
                return
        }

                setDisponibilidad('checking')
        const timer = setTimeout(async () => {
                const BUFFER_MIN = 30
                const startTimestamp = `${date}T${startTime}:00`
                const endTimestamp = `${date}T${endTime}:00`
                const startConBuffer = new Date(new Date(startTimestamp).getTime() - BUFFER_MIN * 60000).toISOString()
                const endConBuffer = new Date(new Date(endTimestamp).getTime() + BUFFER_MIN * 60000).toISOString()

                                       const supabase = createClient()
                const { data: existing } = await supabase
                  .from('bookings')
                  .select('id, start_time, end_time')
                  .eq('room_id', membresia.room_id)
                  .in('status', ['confirmed', 'pending'])
                  .lt('start_time', endConBuffer)
                  .gt('end_time', startConBuffer)

                                       if (existing && existing.length > 0) {
                                                 const h1 = new Date(existing[0].start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                                 const h2 = new Date(existing[0].end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                                 setDisponibilidad('ocupado')
                                                 setConflictoMsg(`Ya hay una reserva de ${h1} a ${h2} (más 30 min de margen)`)
                                       } else {
                                                 setDisponibilidad('libre')
                                                 setConflictoMsg('')
                                       }
        }, 500)

                return () => clearTimeout(timer)
  }, [membresia?.room_id, date, startTime, endTime])

  const startH = parseInt(startTime.split(':')[0])
    const endH = parseInt(endTime.split(':')[0])
    const startM = parseInt(startTime.split(':')[1])
    const endM = parseInt(endTime.split(':')[1])
    const duracionHoras = Math.max(0, (endH * 60 + endM - startH * 60 - startM) / 60)

  const horasDisponibles = membresia ? Math.max(0, membresia.hours_total - membresia.hours_used) : 0
    const horasPostReserva = Math.max(0, horasDisponibles - duracionHoras)
    const sinCupo = duracionHoras > horasDisponibles

  async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError('')

      if (duracionHoras < 1) {
              setError('La duración mínima es 1 hora')
              setSaving(false)
              return
      }
        if (endTime <= startTime) {
                setError('La hora de fin debe ser posterior a la de inicio')
                setSaving(false)
                return
        }
        if (sinCupo) {
                setError(`Solo tenés ${horasDisponibles}hs disponibles`)
                setSaving(false)
                return
        }
        if (disponibilidad === 'ocupado') {
                setError('Ese horario no está disponible. Elegí otro.')
                setSaving(false)
                return
        }

      const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('No autenticado'); setSaving(false); return }

      const startTimestamp = `${date}T${startTime}:00`
        const endTimestamp = `${date}T${endTime}:00`

      // Verificación final de solapamiento (por seguridad)
      const BUFFER_MIN = 30
        const startConBuffer = new Date(new Date(startTimestamp).getTime() - BUFFER_MIN * 60000).toISOString()
        const endConBuffer = new Date(new Date(endTimestamp).getTime() + BUFFER_MIN * 60000).toISOString()

      const { data: existing } = await supabase
          .from('bookings')
          .select('id, start_time, end_time')
          .eq('room_id', membresia!.room_id)
          .in('status', ['confirmed', 'pending'])
          .lt('start_time', endConBuffer)
          .gt('end_time', startConBuffer)

      if (existing && existing.length > 0) {
              const h1 = new Date(existing[0].start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              const h2 = new Date(existing[0].end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              setError(`La sala no está disponible en ese horario (${h1} – ${h2}). Probá otro horario.`)
              setSaving(false)
              return
      }

      const { error: insertError } = await supabase.from('bookings').insert({
              user_id: user.id,
              room_id: membresia!.room_id,
              start_time: startTimestamp,
              end_time: endTimestamp,
              notes: buildNotes() || null,
              status: 'pending',
              precio_total: 0,
              monto_sena: 0,
              medio_pago: 'membresia',
              tipo_cliente: 'miembro',
              user_name: userName,
              membership_id: membresia!.id,
      })

      if (insertError) {
              setError('Error al enviar la solicitud')
              setSaving(false)
      } else {
              setExito(true)
      }
  }

  if (loading) {
        return (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Cargando...</div>div>
                </div>div>
              )
  }
  
    return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl" style={{ background: '#0a2744' }}>
                                  <div>
                                              <p className="text-xs font-medium" style={{ color: '#c5e84a' }}>Solicitar turno</p>p>
                                              <p className="text-white font-semibold">{membresia?.room_name || 'Tu sala'}</p>p>
                                  </div>div>
                                  <button onClick={onClose} className="text-blue-200 hover:text-white text-2xl leading-none">×</button>button>
                        </div>div>
                
                  {exito ? (
                      <div className="p-8 text-center">
                                  <p className="text-4xl mb-3">🕐</p>p>
                                  <p className="text-lg font-bold text-gray-800 mb-2">¡Solicitud enviada!</p>p>
                                  <p className="text-gray-500 text-sm mb-6">
                                                El equipo de Oruga va a revisar tu pedido y te confirmamos a la brevedad por WhatsApp.
                                  </p>p>
                                  <button onClick={onSaved}
                                                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white"
                                                  style={{ background: '#0a2744' }}>
                                                Entendido
                                  </button>button>
                      </div>div>
                    ) : !membresia ? (
                      <div className="p-8 text-center">
                                  <p className="text-4xl mb-3">⭐</p>p>
                                  <p className="text-lg font-bold text-gray-800 mb-2">Sin membresía activa</p>p>
                                  <p className="text-gray-500 text-sm mb-6">
                                                Para solicitar turnos necesitás una membresía activa. Escribinos y te ayudamos.
                                  </p>p>
                                  <a href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Me%20interesa%20sacar%20una%20membres%C3%ADa"
                                                  target="_blank" rel="noopener noreferrer"
                                                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white"
                                                  style={{ background: '#25D366' }}>
                                                Consultar por WhatsApp
                                  </a>a>
                      </div>div>
                    ) : esFinDeSemana ? (
                      /* Fin de semana: redirigir a WhatsApp */
                      <div className="p-8 text-center">
                                  <p className="text-4xl mb-3">📅</p>p>
                                  <p className="text-lg font-bold text-gray-800 mb-2">Reserva para fin de semana</p>p>
                                  <p className="text-gray-500 text-sm mb-2">
                                                La fecha seleccionada es <strong>{fechaElegida.getDay() === 6 ? 'sábado' : 'domingo'}</strong>strong>.
                                  </p>p>
                                  <p className="text-gray-500 text-sm mb-6">
                                                Para reservar los fines de semana, consultá disponibilidad y coordina directamente por WhatsApp con el equipo de Oruga.
                                  </p>p>
                                  <a
                                                  href={`https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20reservar%20la%20sala%20${encodeURIComponent(membresia.room_name)}%20para%20el%20${encodeURIComponent(date)}%20desde%20las%20${encodeURIComponent(startTime)}%20hasta%20las%20${encodeURIComponent(endTime)}.%20Soy%20miembro%20${encodeURIComponent(userName)}.`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white mb-3"
                                                  style={{ background: '#25D366' }}
                                                >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                </svg>svg>
                                                Consultar por WhatsApp
                                  </a>a>
                                  <button onClick={onClose}
                                                  className="w-full py-2.5 rounded-xl font-medium text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
                                                Cambiar fecha
                                  </button>button>
                      </div>div>
                    ) : (
                      <form onSubmit={handleSubmit} className="p-5 space-y-4">
                      
                        {/* Info membresía */}
                                  <div className="rounded-xl px-4 py-3 flex items-center justify-between text-sm" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                                                <div>
                                                                <p className="font-semibold text-green-800">{membresia.plan}</p>p>
                                                                <p className="text-green-600 text-xs">Membresía activa · {userName}</p>p>
                                                </div>div>
                                                <div className="text-right">
                                                                <p className="font-bold text-green-700 text-lg">{horasDisponibles}hs</p>p>
                                                                <p className="text-green-600 text-xs">disponibles</p>p>
                                                </div>div>
                                  </div>div>
                      
                        {/* Fecha */}
                                  <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>label>
                                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                                                                  min={new Date().toISOString().split('T')[0]}
                                                                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900" />
                                    {esFinDeSemana && (
                                        <p className="text-amber-600 text-xs mt-1">⚠ Fecha de fin de semana — al continuar se abrirá WhatsApp para coordinar</p>p>
                                                )}
                                  </div>div>
                      
                        {/* Horario */}
                                  <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>label>
                                                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required
                                                                                    min="07:00" max="21:00"
                                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900" />
                                                </div>div>
                                                <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>label>
                                                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required
                                                                                    min="07:00" max="21:00"
                                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900" />
                                                </div>div>
                                  </div>div>
                      
                        {/* Disponibilidad en tiempo real */}
                        {endTime > startTime && disponibilidad !== null && (
                                      <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
                                                        disponibilidad === 'checking' ? 'bg-gray-50 border border-gray-200 text-gray-400' :
                                                        disponibilidad === 'libre' ? 'bg-green-50 border border-green-200 text-green-700' :
                                                        'bg-red-50 border border-red-200 text-red-600'
                                      }`}>
                                        {disponibilidad === 'checking' && <span className="animate-spin">⏳</span>span>}
                                        {disponibilidad === 'libre' && <span>✅</span>span>}
                                        {disponibilidad === 'ocupado' && <span>🚫</span>span>}
                                                      <div>
                                                        {disponibilidad === 'checking' && <span>Verificando disponibilidad...</span>span>}
                                                        {disponibilidad === 'libre' && <span className="font-semibold">Horario disponible</span>span>}
                                                        {disponibilidad === 'ocupado' && (
                                                            <div>
                                                                                  <p className="font-semibold">Horario no disponible</p>p>
                                                                                  <p className="text-xs mt-0.5">{conflictoMsg}</p>p>
                                                            </div>div>
                                                                        )}
                                                      </div>div>
                                      </div>div>
                                  )}
                      
                        {/* Resumen horas */}
                        {duracionHoras > 0 && (
                                      <div className={`rounded-xl px-4 py-3 text-sm ${sinCupo ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-100'}`}>
                                                      <div className="flex justify-between text-gray-600 mb-1">
                                                                        <span>Esta reserva</span>span><span className="font-medium">{duracionHoras}hs</span>span>
                                                      </div>div>
                                                      <div className={`flex justify-between font-bold ${sinCupo ? 'text-red-600' : 'text-blue-700'}`}>
                                                                        <span>Te quedan después</span>span>
                                                                        <span>{sinCupo ? '⚠ Sin cupo suficiente' : `${horasPostReserva}hs`}</span>span>
                                                      </div>div>
                                      </div>div>
                                  )}
                      
                        {/* Servicios */}
                                  <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué necesitás?</label>label>
                                                <div className="grid grid-cols-2 gap-2">
                                                  {SERVICIOS.map(s => (
                                          <label key={s.id}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                                                                                        servicios.includes(s.id)
                                                                                          ? 'border-blue-400 bg-blue-50 text-blue-800 font-semibold'
                                                                                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                                }`}>
                                                              <input type="checkbox" className="accent-blue-600 shrink-0"
                                                                                      checked={servicios.includes(s.id)}
                                                                                      onChange={() => toggleServicio(s.id)} />
                                            {s.label}
                                          </label>label>
                                        ))}
                                                </div>div>
                                  </div>div>
                      
                        {/* Acompañantes */}
                                  <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                                <label className="block text-sm font-medium text-gray-700">Acompañantes (opcional)</label>label>
                                                                <button type="button"
                                                                                    onClick={() => setAcompañantes(a => [...a, { nombre: '', dni: '' }])}
                                                                                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">
                                                                                  + Agregar
                                                                </button>button>
                                                </div>div>
                                    {acompañantes.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">Si venís con personas, podés registrarlas aquí</p>p>
                                                )}
                                                <div className="space-y-2">
                                                  {acompañantes.map((a, i) => (
                                          <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-lg px-3 py-2">
                                                              <div className="flex-1 grid grid-cols-2 gap-2">
                                                                                    <input type="text" placeholder="Nombre y apellido"
                                                                                                              value={a.nombre}
                                                                                                              onChange={e => setAcompañantes(prev => prev.map((p, idx) => idx === i ? { ...p, nombre: e.target.value } : p))}
                                                                                                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white" />
                                                                                    <input type="text" placeholder="DNI (sin puntos)"
                                                                                                              value={a.dni}
                                                                                                              onChange={e => setAcompañantes(prev => prev.map((p, idx) => idx === i ? { ...p, dni: e.target.value } : p))}
                                                                                                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white" />
                                                              </div>div>
                                                              <button type="button"
                                                                                      onClick={() => setAcompañantes(a => a.filter((_, idx) => idx !== i))}
                                                                                      className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>button>
                                          </div>div>
                                        ))}
                                                </div>div>
                                  </div>div>
                      
                        {/* Notas adicionales */}
                                  <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales (opcional)</label>label>
                                                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                                                                  placeholder="Cualquier otra información..."
                                                                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-gray-900 text-sm" />
                                  </div>div>
                      
                        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>div>}
                      
                                  <div className="flex gap-3 pt-1">
                                                <button type="button" onClick={onClose}
                                                                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                                                Cancelar
                                                </button>button>
                                                <button type="submit" disabled={saving || sinCupo || duracionHoras < 1 || disponibilidad === 'ocupado' || disponibilidad === 'checking'}
                                                                  className="flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                                                                  style={{ background: '#0a2744' }}>
                                                  {saving ? 'Enviando...' : 'Solicitar turno'}
                                                </button>button>
                                  </div>div>
                      </form>form>
                        )}
                </div>div>
          </div>div>
        )
}</div>
