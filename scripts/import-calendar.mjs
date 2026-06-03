import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(k + '=(.+)'))?.[1]?.trim()

const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Utilidades ICS ───────────────────────────────────────────────────────────
function parseICS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const events = []
  const blocks = content.split('BEGIN:VEVENT').slice(1)
  for (const block of blocks) {
    const lines = block.replace(/\r\n /g, '').split(/\r?\n/)
    const ev = {}
    for (const line of lines) {
      const idx = line.indexOf(':')
      if (idx === -1) continue
      const key = line.slice(0, idx).replace(/;[^:]+/, '')
      ev[key] = line.slice(idx + 1).trim()
    }
    events.push(ev)
  }
  return events
}

// Convierte timestamp ICS a Date en timezone Argentina (UTC-3)
function parseICSDate(val) {
  if (!val) return null
  // All-day: 20250929
  if (/^\d{8}$/.test(val)) {
    return new Date(`${val.slice(0,4)}-${val.slice(4,6)}-${val.slice(6,8)}T00:00:00-03:00`)
  }
  // With time: 20250929T190000 or 20250929T193000Z
  const y = val.slice(0,4), mo = val.slice(4,6), d = val.slice(6,8)
  const h = val.slice(9,11), mi = val.slice(11,13), s = val.slice(13,15)
  const tz = val.endsWith('Z') ? 'Z' : '-03:00'
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${tz}`)
}

// Expande RRULE semanal (solo FREQ=WEEKLY con BYDAY y UNTIL/COUNT)
function expandWeekly(dtstart, dtend, rrule, exdates) {
  const occurrences = []
  const until = rrule.match(/UNTIL=(\d{8})/)?.[1]
  const count = parseInt(rrule.match(/COUNT=(\d+)/)?.[1] || '52')
  const byday = rrule.match(/BYDAY=([A-Z,]+)/)?.[1]?.split(',') || []
  const dayMap = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 }
  const targetDays = byday.map(d => dayMap[d]).filter(d => d !== undefined)

  const start = new Date(dtstart)
  const durationMs = new Date(dtend) - new Date(dtstart)

  let cur = new Date(start)
  let found = 0
  const untilDate = until ? new Date(`${until.slice(0,4)}-${until.slice(4,6)}-${until.slice(6,8)}T23:59:59-03:00`) : null

  for (let i = 0; i < 365 && found < count; i++) {
    if (targetDays.length === 0 || targetDays.includes(cur.getDay())) {
      if (untilDate && cur > untilDate) break
      const dateKey = cur.toISOString().slice(0,10)
      if (!exdates.some(e => e.slice(0,10) === dateKey)) {
        occurrences.push({
          start: new Date(cur),
          end: new Date(cur.getTime() + durationMs)
        })
        found++
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  return occurrences
}

// ─── Mapeo de salas ───────────────────────────────────────────────────────────
const SALA_MAP = {
  'CALATHEA': 'Calathea',
  'POTHUS 2': 'Pothus 2',
  'PANDURATA': 'Pandurata',
  'BROMELIA': 'Bromelia',
  'ALOCASIA': 'Alocasia',
  'BEGONIA': 'Begonia',
  'PEPEROMIA': 'Peperomia',
  'POTHUS': 'Pothus',
}

function detectarSala(summary) {
  const upper = summary.toUpperCase()
  for (const [key, val] of Object.entries(SALA_MAP)) {
    if (upper.includes(key)) return val
  }
  return null
}

function extraerCliente(summary) {
  // Formato típico: "SALA (HH A HH) CLIENTE - detalle"
  const match = summary.match(/\([^)]+\)\s*(.+)/)
  return match ? match[1].trim() : summary
}

function extraerHorario(summary) {
  const match = summary.match(/\((\d+)(?::(\d+))?\s*[Aa]\s*(\d+)(?::(\d+))?/)
  if (match) {
    const h1 = match[1].padStart(2,'0'), m1 = (match[2]||'00').padStart(2,'0')
    const h2 = match[3].padStart(2,'0'), m2 = (match[4]||'00').padStart(2,'0')
    return { startTime: `${h1}:${m1}`, endTime: `${h2}:${m2}` }
  }
  return null
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Obtener salas
  const { data: rooms } = await sb.from('rooms').select('id, name')
  const roomMap = Object.fromEntries(rooms.map(r => [r.name, r.id]))
  console.log('Salas disponibles:', Object.keys(roomMap).join(', '))

  const icsPath = 'C:\\Users\\Alan\\Downloads\\Oruga Coworking_cbb76d007032050403014cbc4b0a4e4025b5d05a9419f5083d6d86c5a24c26ac@group.calendar.google.com.ics'
  const events = parseICS(icsPath)

  // Filtrar solo reservas reales (tienen nombre de sala en el summary)
  const SKIP = ['FERIADO', 'renovacion', 'solo se', 'CUMPLE', 'Cumpleaños']
  const bookingEvents = events.filter(ev => {
    const s = ev['SUMMARY'] || ''
    return !SKIP.some(skip => s.toLowerCase().includes(skip.toLowerCase())) && detectarSala(s)
  })

  console.log(`\n${bookingEvents.length} eventos de reserva encontrados en el ICS:`)

  const toInsert = []
  const processedUIDs = new Set()

  for (const ev of bookingEvents) {
    const summary = ev['SUMMARY'] || ''
    const salaName = detectarSala(summary)
    const roomId = roomMap[salaName]
    if (!roomId) { console.log(`⚠ Sala no encontrada: ${salaName} en "${summary}"`); continue }

    const cliente = extraerCliente(summary)
    const uid = ev['UID'] || ''
    const rrule = ev['RRULE'] || ''

    // Parsear EXDATE
    const exdateRaw = ev['EXDATE'] || ''
    const exdates = exdateRaw ? [exdateRaw] : []

    const dtstart = parseICSDate(ev['DTSTART'])
    const dtend   = parseICSDate(ev['DTEND'])
    if (!dtstart || !dtend) continue

    let occurrences = []

    if (rrule && rrule.includes('WEEKLY')) {
      // Evento recurrente — expandir
      const baseKey = uid.split('_')[0]
      if (processedUIDs.has(baseKey)) continue  // ya procesado

      // Recolectar todos los segmentos de la misma serie
      const seriesEvents = bookingEvents.filter(e => (e['UID']||'').startsWith(baseKey))
      processedUIDs.add(baseKey)

      for (const seg of seriesEvents) {
        if (!seg['RRULE']) continue
        const sd = parseICSDate(seg['DTSTART'])
        const ed = parseICSDate(seg['DTEND'])
        const exRaw = seg['EXDATE'] || ''
        const exList = exRaw ? exRaw.split(',') : []
        const occ = expandWeekly(sd, ed, seg['RRULE'], exList)
        occurrences.push(...occ)
      }
    } else if (!ev['RECURRENCE-ID']) {
      // Evento simple (no es override de recurrente)
      occurrences = [{ start: dtstart, end: dtend }]
    } else {
      continue // override manejado por el segmento base
    }

    for (const occ of occurrences) {
      const startISO = occ.start.toISOString().replace('Z', '-03:00').slice(0,19)
      const endISO   = occ.end.toISOString().replace('Z', '-03:00').slice(0,19)
      // Ajustar offset si viene de UTC
      const fmt = (d) => {
        const TZ = 'America/Argentina/Cordoba'
        const date = d.toLocaleDateString('sv-SE', { timeZone: TZ }) // YYYY-MM-DD
        const time = d.toLocaleTimeString('sv-SE', { timeZone: TZ, hour12: false }) // HH:MM:SS
        return `${date}T${time}`
      }
      const startStr = fmt(occ.start)
      const endStr   = fmt(occ.end)

      toInsert.push({
        summary, salaName, cliente,
        start: startStr, end: endStr, roomId
      })
      console.log(`  ✓ ${salaName} | ${startStr.slice(0,16)} | ${cliente}`)
    }
  }

  console.log(`\nTotal: ${toInsert.length} reservas a importar`)
  if (toInsert.length === 0) { console.log('Nada para importar'); return }

  // Insertar en Supabase
  // Primero eliminar las que importamos antes (2025)
  const { data: viejas, error: delErr } = await sb.from('bookings')
    .select('id, start_time')
    .like('notes', 'Importado desde Google Calendar%')
    .lt('start_time', '2026-05-01')
  if (viejas?.length) {
    const ids = viejas.map(v => v.id)
    await sb.from('bookings').delete().in('id', ids)
    console.log(`🗑 Eliminadas ${ids.length} reservas importadas previas (anteriores a mayo 2026)`)
  }

  // Filtrar solo desde mayo 2026
  const desde2026 = toInsert.filter(r => r.start >= '2026-05-01')
  console.log(`\n📅 Reservas desde mayo 2026: ${desde2026.length}`)
  if (desde2026.length === 0) {
    console.log('El calendario de Google no tiene eventos de mayo 2026 en adelante.')
    console.log('El sistema solo muestra reservas cargadas desde el panel admin.')
    return
  }

  let ok = 0, skip = 0
  for (const r of desde2026) {
    // Verificar si ya existe
    const { data: existing } = await sb.from('bookings')
      .select('id')
      .eq('room_id', r.roomId)
      .eq('start_time', r.start)
      .limit(1)

    if (existing?.length > 0) { skip++; continue }

    const { error } = await sb.from('bookings').insert({
      room_id: r.roomId,
      start_time: r.start,
      end_time: r.end,
      status: 'confirmed',
      user_name: r.cliente,
      notes: `Importado desde Google Calendar: ${r.summary}`,
      precio_total: 0,
      monto_pagado: 0,
      monto_sena: 0,
      medio_pago: 'efectivo',
      tipo_cliente: 'externo',
    })
    if (error) console.error('Error insertando:', error.message)
    else ok++
  }

  console.log(`\n✅ Importadas: ${ok} | Ya existían: ${skip}`)
}

main().catch(console.error)
