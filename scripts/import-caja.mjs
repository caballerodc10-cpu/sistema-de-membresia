/**
 * Script de importación de la planilla de caja al sistema.
 * Crea la tabla `caja` en Supabase e inserta todos los datos del CSV.
 * Uso: node scripts/import-caja.mjs "ruta/al/archivo.csv"
 */

import fs from 'fs'
import path from 'path'

const SUPABASE_URL = 'https://jxvmxhesyujthvtyyzmi.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4dm14aGVzeXVqdGh2dHl5em1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU2MTk1MSwiZXhwIjoyMDk0MTM3OTUxfQ.ffrqNqPtUXCQymJ6JYWt74cDuoyKi6afB-LqxcUspj8'

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS caja (
  id bigserial PRIMARY KEY,
  mes text,
  fecha date,
  tipo_comp text,
  n_comprob text,
  coworker text,
  forma_pago text,
  medio_pago text,
  precio_neto numeric,
  iva numeric,
  ingreso numeric,
  pendientes numeric,
  pagos_nuestros numeric,
  descuentos numeric,
  ingresado numeric,
  gastos numeric,
  sala text,
  concepto text,
  observaciones text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Solo admins leen caja"
  ON caja FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Solo admins insertan caja"
  ON caja FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Solo admins actualizan caja"
  ON caja FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Solo admins borran caja"
  ON caja FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
`

/**
 * Intenta crear la tabla via pgMeta API de Supabase (usado por el Studio)
 */
async function tryCreateTableViaMeta() {
  try {
    const res = await fetch(`${SUPABASE_URL}/pg/meta/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: CREATE_TABLE_SQL }),
    })
    if (res.ok) {
      console.log('✅ Tabla `caja` creada via pgMeta API')
      return true
    }
  } catch {}
  return false
}

/**
 * Verifica si la tabla caja existe intentando un SELECT
 */
async function tableExists() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/caja?limit=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  })
  return res.status !== 404 && res.status !== 406
}

/**
 * Convierte string de peso argentino a número
 * Ej: "$ 19.500,00" → 19500, "-$ 78.500,00" → -78500
 */
function parseARS(s) {
  if (!s) return null
  s = s.trim()
  if (!s) return null
  const negative = s.startsWith('-')
  // Remover $, -, espacios
  s = s.replace(/-/g, '').replace(/\$/g, '').replace(/\s/g, '').trim()
  if (!s || s === '0,00' || s === '0') return 0
  // Formato argentino: . = miles, , = decimal
  // Ej: "19.500,00" → 19500.00
  s = s.replace(/\./g, '').replace(',', '.')
  const val = parseFloat(s)
  if (isNaN(val)) return null
  return negative ? -val : val
}

/**
 * Parsea fecha DD/MM/YYYY a YYYY-MM-DD
 */
function parseDate(s) {
  if (!s) return null
  s = s.trim()
  if (!s) return null
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (!d || !m || !y) return null
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/**
 * Detecta el mes desde la fecha
 */
function getMesFromFecha(fechaStr) {
  if (!fechaStr) return null
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const parts = fechaStr.split('/')
  if (parts.length >= 2) {
    const m = parseInt(parts[1]) - 1
    if (m >= 0 && m < 12) return meses[m]
  }
  return null
}

/**
 * Lee y parsea el CSV (encoding latin1 / windows-1252)
 */
function parseCSV(filePath) {
  const buf = fs.readFileSync(filePath)
  // Decodificar latin1 manualmente (NodeJS lee como latin1 con binary)
  const content = buf.toString('latin1')
  const lines = content.split('\n')

  // Buscar la línea del header (contiene "FECHA" y "TIPO COMP")
  let headerLine = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('TIPO COMP') && lines[i].includes('FECHA')) {
      headerLine = i
      break
    }
  }

  if (headerLine === -1) {
    throw new Error('No se encontró la línea de encabezado en el CSV')
  }

  console.log(`📋 Header encontrado en línea ${headerLine + 1}`)

  const rows = []
  // Procesar líneas de datos (desde headerLine+1)
  for (let i = headerLine + 1; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (!line) continue

    const cols = line.split(';')

    // Ignorar líneas de resumen/totales (sin fecha válida y con texto de resumen)
    const rawFecha = (cols[1] || '').trim()
    const rawConcepto = (cols[16] || '').trim()
    const rawCoworker = (cols[4] || '').trim()

    // Detectar líneas de sección o totales
    if (cols[0].includes('LISTADO') || cols[0].includes('subtotal') ||
        rawCoworker.includes('CALCULO') || rawCoworker.includes('PRECIO CON IVA') ||
        rawCoworker.includes('MEMBRESIA') || rawCoworker.includes('GASTOS MARZO') ||
        rawCoworker.includes('ABONADO') || rawCoworker.includes('SALDO PENDIENTE')) {
      continue
    }

    const fecha = parseDate(rawFecha)

    // Solo procesar filas con fecha válida O con datos de ingreso/gasto
    const rawIngreso = (cols[9] || '').trim()
    const rawGastos = (cols[14] || '').trim()
    const hasData = fecha || rawIngreso || rawGastos

    if (!hasData) continue
    if (!fecha) continue // Requerir fecha válida para los registros principales

    const mesFromFecha = getMesFromFecha(rawFecha)
    const mes = (cols[0] || '').trim() || mesFromFecha || ''

    const row = {
      mes,
      fecha,
      tipo_comp: (cols[2] || '').trim() || null,
      n_comprob: (cols[3] || '').trim() || null,
      coworker: (cols[4] || '').trim() || null,
      forma_pago: (cols[5] || '').trim() || null,
      medio_pago: (cols[6] || '').trim() || null,
      precio_neto: parseARS(cols[7]),
      iva: parseARS(cols[8]),
      ingreso: parseARS(cols[9]),
      pendientes: parseARS(cols[10]),
      pagos_nuestros: parseARS(cols[11]),
      descuentos: parseARS(cols[12]),
      ingresado: parseARS(cols[13]),
      gastos: parseARS(cols[14]),
      sala: (cols[15] || '').trim() || null,
      concepto: (cols[16] || '').trim() || null,
      observaciones: (cols[17] || '').trim() || null,
    }

    // Limpiar campos con texto que no son números
    if (typeof row.precio_neto === 'string') row.precio_neto = null
    if (typeof row.iva === 'string') row.iva = null

    rows.push(row)
  }

  return rows
}

/**
 * Inserta filas en batches vía REST API (service role bypasses RLS)
 */
async function insertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/caja`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Error insertando batch: ${res.status} ${body}`)
  }
}

async function main() {
  const csvPath = process.argv[2] || 'C:\\Users\\Alan\\Downloads\\Planilla de caja(caja 2026) ayer.csv'

  console.log(`\n🚀 Importación de Planilla de Caja`)
  console.log(`📁 Archivo: ${csvPath}\n`)

  // 1. Parsear CSV
  console.log('📊 Parseando CSV...')
  const rows = parseCSV(csvPath)
  console.log(`✅ ${rows.length} registros encontrados`)

  // 2. Verificar/crear tabla
  console.log('\n🔧 Verificando tabla `caja`...')
  const exists = await tableExists()

  if (!exists) {
    console.log('⚠️  Tabla no existe. Intentando crear...')
    const created = await tryCreateTableViaMeta()

    if (!created) {
      console.log('\n❌ No se pudo crear la tabla automáticamente.')
      console.log('📋 Por favor ejecutá este SQL en el Supabase Dashboard')
      console.log('   (https://supabase.com/dashboard/project/jxvmxhesyujthvtyyzmi/sql)\n')
      console.log('--- SQL A EJECUTAR ---')
      // Print simplified CREATE TABLE
      console.log(`CREATE TABLE IF NOT EXISTS caja (
  id bigserial PRIMARY KEY,
  mes text,
  fecha date,
  tipo_comp text,
  n_comprob text,
  coworker text,
  forma_pago text,
  medio_pago text,
  precio_neto numeric,
  iva numeric,
  ingreso numeric,
  pendientes numeric,
  pagos_nuestros numeric,
  descuentos numeric,
  ingresado numeric,
  gastos numeric,
  sala text,
  concepto text,
  observaciones text,
  created_at timestamptz DEFAULT now()
);`)
      console.log('--- FIN SQL ---\n')
      console.log('Después de crear la tabla, volvé a ejecutar este script.')
      process.exit(1)
    }
  } else {
    console.log('✅ Tabla `caja` existe')
  }

  // 3. Insertar datos en batches de 100
  console.log('\n📥 Insertando datos...')
  const BATCH_SIZE = 100
  let inserted = 0
  let errors = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    try {
      await insertBatch(batch)
      inserted += batch.length
      process.stdout.write(`\r   ${inserted}/${rows.length} insertados...`)
    } catch (err) {
      console.error(`\n❌ Error en batch ${i}-${i + BATCH_SIZE}: ${err.message}`)
      errors++
    }
  }

  console.log(`\n\n✅ Importación completada!`)
  console.log(`   ✔  ${inserted} registros insertados`)
  if (errors > 0) console.log(`   ✘  ${errors} batches con error`)
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
