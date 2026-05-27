/**
 * Importar membresías reales desde la planilla de caja
 * Ejecutar: node scripts/import-memberships.mjs
 *
 * NOTA: Si ya existen estas membresías, el script las omite.
 *       Para limpiar y reimportar, primero vaciar la tabla memberships.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan variables de entorno. Asegurate de tener .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
  'Prefer': 'return=representation',
}

// Datos reales extraídos de la planilla de caja mayo 2026
// hours_used = horas ya consumidas estimadas en base al calendario de mayo
const memberships = [
  {
    user_name: 'Fernando Piñeyro – Anatomía',
    plan: 'Bromelia',
    hours_total: 160,
    hours_used: 120,
    valid_until: '2026-05-31',
    monto_mensual: 554000,
    notas: 'Fact B. Mayo 2026: $363.000 + $187.000. Sala Bromelia – clases de anatomía artística.',
  },
  {
    user_name: 'CeIATE – Soledad González',
    plan: 'Calathea',
    hours_total: 20,
    hours_used: 14,
    valid_until: '2026-05-31',
    monto_mensual: 285000,
    notas: 'Seña $100.000 + saldo $185.000. Transferencia. Calathea – investigación y talleres.',
  },
  {
    user_name: 'Camba Cua',
    plan: 'Pothus 2',
    hours_total: 30,
    hours_used: 22,
    valid_until: '2026-05-31',
    monto_mensual: 252500,
    notas: 'Membresía Pothus 2. 30 hs/mes. Transferencia.',
  },
  {
    user_name: 'Nadia Medina – Modelaje',
    plan: 'Pothus',
    hours_total: 20,
    hours_used: 12,
    valid_until: '2026-05-31',
    monto_mensual: 343800,
    notas: 'Pothus reuniones. Clases de modelaje y pasarela.',
  },
  {
    user_name: 'Club de Robótica',
    plan: 'Begonia',
    hours_total: 22,
    hours_used: 16,
    valid_until: '2026-05-31',
    monto_mensual: 420000,
    notas: 'Begonia (16 hs) + Pothus (6 hs). Taller de robótica infantil.',
  },
  {
    user_name: 'PSA Equipo Maie',
    plan: 'Peperomia',
    hours_total: 21,
    hours_used: 15,
    valid_until: '2026-05-31',
    monto_mensual: 209000,
    notas: 'Sala Peperomia. 21 hs/mes.',
  },
  {
    user_name: 'Distribuidora AWA',
    plan: 'Calathea',
    hours_total: 24,
    hours_used: 18,
    valid_until: '2026-05-31',
    monto_mensual: 431232,
    notas: 'Factura A. Calathea 24 hs/mes. Transferencia bancaria.',
  },
  {
    user_name: 'Academia Tales',
    plan: 'Bromelia',
    hours_total: 24,
    hours_used: 18,
    valid_until: '2026-05-31',
    monto_mensual: 810000,
    notas: 'Bromelia (16 hs) + Pothus reuniones (8 hs). Academia de idiomas.',
  },
  {
    user_name: 'Estudio Munaretto',
    plan: 'Peperomia',
    hours_total: 30,
    hours_used: 8,
    valid_until: '2026-07-31',
    monto_mensual: 291667,
    notas: 'Contrato trimestral $875.000 (≈ $291.667/mes). Sala Peperomia. Vence julio 2026.',
  },
  {
    user_name: 'Crowdar',
    plan: 'Pothus',
    hours_total: 10,
    hours_used: 7,
    valid_until: '2026-05-31',
    monto_mensual: 282172,
    notas: 'Fact B. Pothus reuniones. 10 hs/mes. Banco Patagonia.',
  },
]

async function checkExisting() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/memberships?select=user_name`, {
    headers: { ...headers, 'Prefer': '' },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return new Set(data.map(d => d.user_name))
}

async function insertMembership(m) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/memberships`, {
    method: 'POST',
    headers,
    body: JSON.stringify(m),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}

async function main() {
  console.log('🌿 Importando membresías reales de la planilla...\n')

  let existing
  try {
    existing = await checkExisting()
    console.log(`ℹ️  Membresías existentes en DB: ${existing.size}`)
    if (existing.size > 0) {
      console.log('   Existentes:', [...existing].join(', '))
    }
  } catch (err) {
    console.error('Error al verificar tabla memberships:', err.message)
    console.log('\n💡 Asegurate de que la tabla memberships exista en Supabase.')
    process.exit(1)
  }

  let insertados = 0
  let omitidos = 0

  for (const m of memberships) {
    if (existing.has(m.user_name)) {
      console.log(`⏭  Omitido (ya existe): ${m.user_name}`)
      omitidos++
      continue
    }

    try {
      await insertMembership(m)
      console.log(`✅ Insertado: ${m.user_name} (${m.plan} – ${m.hours_used}/${m.hours_total} hs)`)
      insertados++
    } catch (err) {
      console.error(`❌ Error insertando ${m.user_name}:`, err.message)
    }
  }

  console.log(`\n📊 Resultado: ${insertados} insertados, ${omitidos} omitidos`)
  console.log('✨ Listo. Refrescá la página de Membresías en el panel.')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
