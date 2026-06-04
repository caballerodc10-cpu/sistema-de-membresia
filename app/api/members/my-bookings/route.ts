import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Obtener nombre del usuario para buscar también por user_name (importados del calendario)
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { data: membership } = await admin
      .from('memberships')
      .select('user_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const userName = membership?.user_name || profile?.full_name || ''

    // Buscar bookings por user_id o por user_name (para reservas importadas)
    let query = admin
      .from('bookings')
      .select('*, rooms(name, capacity)')
      .or(`user_id.eq.${user.id}${userName ? `,user_name.ilike.${userName}` : ''}`)
      .order('start_time', { ascending: false })

    const { data: bookings, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(bookings || [])
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
