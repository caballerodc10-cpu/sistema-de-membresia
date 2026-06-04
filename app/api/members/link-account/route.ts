import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

// POST: { membership_id, email } → busca el user por email y setea user_id en la membresía
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { membership_id, email } = await req.json()
    if (!membership_id || !email) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    // Buscar usuario por email en auth.users (vía profiles que tiene el id)
    const { data: { users }, error: usersErr } = await admin.auth.admin.listUsers()
    if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!targetUser) return NextResponse.json({ error: `No existe ningún usuario con el email "${email}"` }, { status: 404 })

    // Verificar que no tenga ya otra membresía vinculada
    const { data: existing } = await admin
      .from('memberships')
      .select('id, user_name')
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (existing && existing.id !== membership_id) {
      return NextResponse.json({
        error: `Ese usuario ya tiene la membresía "${existing.user_name}" vinculada`
      }, { status: 409 })
    }

    // Vincular
    const { error: updateErr } = await admin
      .from('memberships')
      .update({ user_id: targetUser.id })
      .eq('id', membership_id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, user_name: targetUser.email })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE: { membership_id } → desvincula
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { membership_id } = await req.json()
    await admin.from('memberships').update({ user_id: null }).eq('id', membership_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
