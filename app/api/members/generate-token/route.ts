import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { membership_id } = await req.json()
    if (!membership_id) return NextResponse.json({ error: 'Falta membership_id' }, { status: 400 })

    // Generar token único de 32 caracteres (256 bits de entropía)
    const token = randomBytes(16).toString('hex')

    const { data, error } = await admin
      .from('memberships')
      .update({ portal_token: token })
      .eq('id', membership_id)
      .select('portal_token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ token: data.portal_token })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE: revocar token (invalida el link)
export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { membership_id } = await req.json()
    await admin.from('memberships').update({ portal_token: null }).eq('id', membership_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
