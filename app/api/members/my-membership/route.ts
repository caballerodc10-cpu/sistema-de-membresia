import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Obtener perfil del usuario
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // 1º intento: buscar por user_id (vinculada por el admin)
    let membership: any = null
    const { data: memById } = await admin
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    membership = memById

    // 2º intento: buscar por full_name exacto (cliente individual)
    if (!membership && profile?.full_name) {
      const { data: memByName } = await admin
        .from('memberships')
        .select('*')
        .eq('user_name', profile.full_name)
        .maybeSingle()
      membership = memByName
    }

    if (!membership) {
      return NextResponse.json({ membership: null, payments: [], profile })
    }

    // Todos los pagos de esta membresía, historial completo
    const { data: payments } = await admin
      .from('payments')
      .select('*')
      .eq('membership_id', membership.id)
      .order('fecha', { ascending: false })

    return NextResponse.json({ membership, payments: payments || [] })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
