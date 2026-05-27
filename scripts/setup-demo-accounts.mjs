import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Leer .env.local
const env = readFileSync('.env.local', 'utf-8')
const get = (key) => { const m = env.match(new RegExp(`^${key}=(.+)$`, 'm')); return m?.[1]?.trim() }

const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY  = get('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🔧 Configurando cuentas demo...\n')

// ── 1. Asegurarse de que caballerodc.10@gmail.com existe como admin
const adminEmail = 'caballerodc.10@gmail.com'
const adminPassword = 'OrugaAdmin2024!'

// Buscar usuario existente
const { data: existingUsers } = await admin.auth.admin.listUsers()
const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail)

let adminUserId
if (existingAdmin) {
  adminUserId = existingAdmin.id
  // Actualizar password
  await admin.auth.admin.updateUserById(adminUserId, { password: adminPassword })
  console.log(`✅ Admin encontrado: ${adminEmail}`)
} else {
  // Crear usuario admin
  const { data: newAdmin, error } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  })
  if (error) { console.error('❌ Error creando admin:', error.message); process.exit(1) }
  adminUserId = newAdmin.user.id
  console.log(`✅ Admin creado: ${adminEmail}`)
}

// Asegurarse de que el perfil tiene role = 'admin'
const { error: profileErr } = await admin.from('profiles').upsert({
  id: adminUserId,
  email: adminEmail,
  full_name: 'Alan Caballero',
  role: 'admin',
}, { onConflict: 'id' })

if (profileErr) console.error('❌ Error perfil admin:', profileErr.message)
else console.log(`✅ Rol admin asignado`)

// ── 2. Crear cuenta cliente demo
const clientEmail = 'cliente@orugacowork.com'
const clientPassword = 'OrugaCliente2024!'

const existingClient = existingUsers?.users?.find(u => u.email === clientEmail)

let clientUserId
if (existingClient) {
  clientUserId = existingClient.id
  await admin.auth.admin.updateUserById(clientUserId, { password: clientPassword })
  console.log(`\n✅ Cliente encontrado: ${clientEmail}`)
} else {
  const { data: newClient, error } = await admin.auth.admin.createUser({
    email: clientEmail,
    password: clientPassword,
    email_confirm: true,
  })
  if (error) { console.error('❌ Error creando cliente:', error.message); process.exit(1) }
  clientUserId = newClient.user.id
  console.log(`\n✅ Cliente creado: ${clientEmail}`)
}

// Perfil del cliente
const { error: clientProfileErr } = await admin.from('profiles').upsert({
  id: clientUserId,
  email: clientEmail,
  full_name: 'Cliente Demo',
  role: 'user',
}, { onConflict: 'id' })

if (clientProfileErr) console.error('❌ Error perfil cliente:', clientProfileErr.message)
else console.log(`✅ Perfil cliente configurado`)

// ── Resultado final
console.log('\n' + '═'.repeat(50))
console.log('🎯 CREDENCIALES LISTAS:')
console.log('═'.repeat(50))
console.log('\n👤 ADMINISTRADOR:')
console.log(`   Email:      ${adminEmail}`)
console.log(`   Contraseña: ${adminPassword}`)
console.log('\n👥 CLIENTE DEMO:')
console.log(`   Email:      ${clientEmail}`)
console.log(`   Contraseña: ${clientPassword}`)
console.log('\n🔗 URL: https://oruga-reservas-caballerodc10-3219s-projects.vercel.app')
console.log('═'.repeat(50))
