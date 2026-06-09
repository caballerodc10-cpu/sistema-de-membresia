import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { randomBytes } from 'crypto'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminSupabaseClient()
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? admin : null
}

// GET: leer configuración (público — solo devuelve la URL de embed, no el token)
export async function GET() {
  const admin = createAdminSupabaseClient()
  const { data } = await admin.from('app_settings').select('*').eq('id', 'main').maybeSingle()
  return NextResponse.json({
    google_cal_embed_url: data?.google_cal_embed_url || null,
    google_cal_edit_url:  data?.google_cal_edit_url  || null,
    has_feed_token:       !!data?.calendar_feed_token,
    feed_token:           data?.calendar_feed_token   || null,
  })
}

// PUT: guardar configuración (solo admin)
export async function PUT(req: Request) {
  const adminClient = await checkAdmin()
  if (!adminClient) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, string> = { updated_at: new Date().toISOString() }

  if ('google_cal_embed_url' in body) updates.google_cal_embed_url = body.google_cal_embed_url || null
  if ('google_cal_edit_url'  in body) updates.google_cal_edit_url  = body.google_cal_edit_url  || null

  // Generar token del feed si no existe
  if (body.generate_feed_token) {
    updates.calendar_feed_token = randomBytes(16).toString('hex')
  }

  const { data, error } = await adminClient
    .from('app_settings')
    .upsert({ id: 'main', ...updates })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    google_cal_embed_url: data.google_cal_embed_url,
    google_cal_edit_url:  data.google_cal_edit_url,
    feed_token:           data.calendar_feed_token,
  })
}
