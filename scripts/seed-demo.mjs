/**
 * seed-demo.mjs
 * Inserta datos de prueba en memberships y payments para testear /members/
 * Uso: node scripts/seed-demo.mjs
 * Para limpiar demo: node scripts/seed-demo.mjs --clean
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
const get = k => env.match(new RegExp(k + '=(.+)'))?.[1]?.trim()

const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false }
})

const mesHoy = new Date().toISOString().slice(0, 7)
const mesPasado = (() => {
  const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7)
})()
const proximoMes = (() => {
  const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7)
})()

// ─── Datos demo ───────────────────────────────────────────────────────────────
const MIEMBROS_DEMO = [
  {
    user_name: 'CAMBA CUA S.A.',
    plan: 'Pothus 2',
    hours_total: 80,
    hours_used: 68,          // ← quedan 12hs (85% usado → alerta horas bajas)
    monto_mensual: 120000,
    valid_until: proximoMes + '-15',
    notas: '2 días por semana · acuerdo trimestral',
    telefono: '3794123456',
    _notas_demo: 'Alerta: horas bajas (85%)',
  },
  {
    user_name: 'Adriana Farah',
    plan: 'Calathea',
    hours_total: 40,
    hours_used: 40,          // ← sin horas disponibles
    monto_mensual: 80000,
    valid_until: mesHoy + '-30',
    notas: 'Turnos martes y jueves',
    telefono: '3794654321',
    _notas_demo: 'Alerta: sin horas + vence pronto',
  },
  {
    user_name: 'AWA Consulting',
    plan: 'Alocasia',
    hours_total: 0,          // ← acceso ilimitado
    hours_used: 0,
    monto_mensual: 200000,
    valid_until: proximoMes + '-01',
    notas: 'Sala exclusiva lunes a viernes',
    telefono: null,
    _notas_demo: 'Al día, sin límite de horas',
  },
  {
    user_name: 'Club Robótica Corrientes',
    plan: 'Begonia',
    hours_total: 60,
    hours_used: 20,
    monto_mensual: 90000,
    valid_until: proximoMes + '-20',
    notas: 'Sábados 9 a 13',
    telefono: '3794987654',
    _notas_demo: 'Pago pendiente',
  },
  {
    user_name: 'Abogados & Asoc.',
    plan: 'Pandurata',
    hours_total: 30,
    hours_used: 10,
    monto_mensual: 60000,
    valid_until: proximoMes + '-10',
    notas: 'Reuniones de directorio',
    telefono: '3794111222',
    _notas_demo: 'Pago parcial',
  },
]

// Pagos del mes actual y anterior por miembro
const PAGOS_POR_MIEMBRO = {
  'CAMBA CUA S.A.': [
    { monto: 120000, fecha: mesHoy + '-05', metodo: 'Transferencia', concepto: `Cuota ${mesHoy}` },
    { monto: 120000, fecha: mesPasado + '-03', metodo: 'Transferencia', concepto: `Cuota ${mesPasado}` },
  ],
  'Adriana Farah': [
    // Sin pago este mes → deuda
    { monto: 80000, fecha: mesPasado + '-10', metodo: 'Efectivo', concepto: `Cuota ${mesPasado}` },
  ],
  'AWA Consulting': [
    { monto: 200000, fecha: mesHoy + '-02', metodo: 'Mercado Pago', concepto: `Cuota ${mesHoy}` },
    { monto: 200000, fecha: mesPasado + '-02', metodo: 'Mercado Pago', concepto: `Cuota ${mesPasado}` },
  ],
  'Club Robótica Corrientes': [
    // Sin pago este mes → deuda
    { monto: 90000, fecha: mesPasado + '-15', metodo: 'Efectivo', concepto: `Cuota ${mesPasado}` },
  ],
  'Abogados & Asoc.': [
    { monto: 30000, fecha: mesHoy + '-08', metodo: 'Transferencia', concepto: 'Pago parcial cuota' },
    { monto: 60000, fecha: mesPasado + '-07', metodo: 'Efectivo', concepto: `Cuota ${mesPasado}` },
  ],
}

async function clean() {
  console.log('🗑  Eliminando datos de demo...')
  const nombres = MIEMBROS_DEMO.map(m => m.user_name)

  // Buscar membresías demo
  const { data: mems } = await sb.from('memberships').select('id, user_name').in('user_name', nombres)
  if (mems?.length) {
    const ids = mems.map(m => m.id)
    await sb.from('payments').delete().in('membership_id', ids)
    await sb.from('memberships').delete().in('id', ids)
    console.log(`  Eliminadas ${ids.length} membresías y sus pagos`)
  } else {
    console.log('  No había datos demo')
  }
}

async function seed() {
  console.log('🌱 Insertando datos de demo...\n')

  // Limpiar demo anterior
  await clean()
  console.log()

  for (const m of MIEMBROS_DEMO) {
    const { _notas_demo, ...datos } = m

    // Insertar membresía
    const { data: mem, error } = await sb.from('memberships').insert({
      ...datos,
      created_at: new Date().toISOString(),
    }).select().single()

    if (error) { console.error(`❌ Error insertando ${m.user_name}:`, error.message); continue }
    console.log(`✅ ${m.user_name} · ${m.plan} [${_notas_demo}]`)

    // Insertar pagos
    const pagos = PAGOS_POR_MIEMBRO[m.user_name] || []
    for (const p of pagos) {
      const { error: pe } = await sb.from('payments').insert({
        membership_id: mem.id,
        user_id: null,
        user_name: m.user_name,
        ...p,
      })
      if (pe) console.error(`  ⚠ Error en pago:`, pe.message)
      else console.log(`   💸 ${p.metodo} · $${p.monto.toLocaleString('es-AR')} · ${p.fecha}`)
    }
    console.log()
  }

  console.log('─────────────────────────────────────────')
  console.log('✨ Demo cargado. Abrí: http://localhost:3000/members/admin')
  console.log()
  console.log('ESCENARIOS PARA PROBAR:')
  console.log('  🔴 CAMBA CUA     → horas al 85% (alerta campana)')
  console.log('  🔴 Adriana Farah → sin horas + sin pago + vence pronto (todas las alertas)')
  console.log('  ✅ AWA Consulting → al día, acceso ilimitado')
  console.log('  ⚠  Club Robótica → sin pago este mes (deuda)')
  console.log('  ⚠  Abogados      → pago parcial (saldo pendiente)')
  console.log()
  console.log('Para limpiar: node scripts/seed-demo.mjs --clean')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
if (process.argv.includes('--clean')) {
  await clean()
  console.log('\n✅ Datos demo eliminados.')
} else {
  await seed()
}
