import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Obtener membresía del usuario (por user_id o por email en user_name)
    const { data: membership } = await admin
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      // Intentar buscar por email si no tiene user_id vinculado
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      return NextResponse.json({ membership: null, payments: [], profile })
    }

    // Todos los pagos de esta membresía (sin filtro de mes, historial completo)
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
