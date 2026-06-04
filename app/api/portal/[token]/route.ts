import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

// GET público — sin autenticación — devuelve solo lo necesario para el portal
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  // Buscar membresía por token
  const { data: membership, error } = await admin
    .from('memberships')
    .select('id, user_name, plan, hours_total, hours_used, valid_until, monto_mensual, notas')
    .eq('portal_token', token)
    .maybeSingle()

  if (error || !membership) {
    return NextResponse.json({ error: 'Link inválido o expirado' }, { status: 404 })
  }

  // Pagos del mes actual — solo monto, fecha, metodo, concepto (sin datos sensibles)
  const mesHoy = new Date().toISOString().slice(0, 7)
  const { data: payments } = await admin
    .from('payments')
    .select('monto, fecha, metodo, concepto')
    .eq('membership_id', membership.id)
    .gte('fecha', mesHoy + '-01')
    .lte('fecha', mesHoy + '-31')
    .order('fecha', { ascending: false })

  // Próximas reservas — solo sala, fecha/hora, status (sin precios internos)
  const { data: bookings } = await admin
    .from('bookings')
    .select('start_time, end_time, status, rooms(name)')
    .or(`user_name.eq.${membership.user_name}`)
    .gte('start_time', new Date().toISOString())
    .in('status', ['confirmed', 'pending'])
    .order('start_time', { ascending: true })
    .limit(5)

  return NextResponse.json({
    membership: {
      user_name:    membership.user_name,
      plan:         membership.plan,
      hours_total:  membership.hours_total,
      hours_used:   membership.hours_used,
      valid_until:  membership.valid_until,
      monto_mensual: membership.monto_mensual,
      notas:        membership.notas,
    },
    payments:  payments || [],
    bookings:  bookings || [],
  })
}
