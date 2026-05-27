/**
 * Crea la tabla `caja` en Supabase via conexión directa a PostgreSQL.
 * Prueba varias combinaciones de credenciales.
 */

import pg from 'pg'
const { Client } = pg

const PROJECT_REF = 'jxvmxhesyujthvtyyzmi'
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

ALTER TABLE IF EXISTS caja ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'caja' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON caja FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`

const connections = [
  // Supabase pooler connection format
  `postgresql://postgres.${PROJECT_REF}:${SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${SERVICE_ROLE_KEY}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  // Direct connection
  `postgresql://postgres:${SERVICE_ROLE_KEY}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
]

async function tryConnect(connectionString) {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 })
  try {
    await client.connect()
    console.log('✅ Conexión exitosa!')
    await client.query(CREATE_TABLE_SQL)
    console.log('✅ Tabla `caja` creada exitosamente!')
    await client.end()
    return true
  } catch (err) {
    try { await client.end() } catch {}
    return false
  }
}

async function main() {
  console.log('🔌 Intentando conectar a la base de datos Supabase...\n')

  for (const conn of connections) {
    const host = conn.match(/@([^:\/]+)/)?.[1]
    process.stdout.write(`   Probando ${host}... `)
    const ok = await tryConnect(conn)
    if (ok) return
    console.log('❌ Falló')
  }

  console.log('\n❌ No se pudo conectar con credenciales automáticas.')
  console.log('\n📋 Para crear la tabla manualmente, ir a:')
  console.log('   https://supabase.com/dashboard/project/jxvmxhesyujthvtyyzmi/sql/new')
  console.log('\nY ejecutar el siguiente SQL:\n')
  console.log(CREATE_TABLE_SQL)
}

main().catch(console.error)
