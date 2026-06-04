import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminSupabaseClient()
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? admin : null
}

// GET: todos los registros con filtros opcionales
export async function GET(req: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const estado     = searchParams.get('estado')
  const convenio   = searchParams.get('convenio')
  const tipo       = searchParams.get('tipo')
  const sala       = searchParams.get('sala')

  let query = admin
    .from('profiles')
    .select('*')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  if (estado)   query = query.eq('estado_registro', estado)
  if (convenio) query = query.eq('convenio', convenio)
  if (tipo)     query = query.eq('tipo_profesional', tipo)
  if (sala)     query = query.eq('sala_preferida', sala)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// PATCH: actualizar estado, notas_admin, tiene_bonificacion de un perfil
export async function PATCH(req: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  // Solo estos campos son actualizables desde este endpoint
  const allowed = ['estado_registro', 'notas_admin', 'tiene_bonificacion', 'role']
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await admin
    .from('profiles')
    .update(filtered)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
