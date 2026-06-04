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

export async function GET(req: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes') || new Date().toISOString().slice(0, 7)
  const desde = mes + '-01'
  const hasta = mes + '-31'

  const [
    { data: payments },
    { data: bookings },
    { data: expenses },
  ] = await Promise.all([
    // Cobros de membresías
    admin.from('payments').select('id,monto,fecha,metodo,concepto,user_name')
      .gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: false }),
    // Cobros de reservas (solo con monto pagado > 0)
    admin.from('bookings').select('id,monto_pagado,precio_total,start_time,user_name,rooms(name)')
      .gte('start_time', desde + 'T00:00:00').lte('start_time', hasta + 'T23:59:59')
      .gt('monto_pagado', 0).order('start_time', { ascending: false }),
    // Egresos (tabla expenses, puede no existir aún)
    admin.from('expenses').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: false }),
  ])

  const totalIngresosMem   = (payments || []).reduce((a, p) => a + (p.monto || 0), 0)
  const totalIngresosRes   = (bookings || []).reduce((a, b) => a + (b.monto_pagado || 0), 0)
  const totalEgresos       = (expenses || []).reduce((a, e) => a + (e.monto || 0), 0)
  const totalIngresos      = totalIngresosMem + totalIngresosRes
  const balance            = totalIngresos - totalEgresos

  return NextResponse.json({
    mes,
    payments:  payments  || [],
    bookings:  bookings  || [],
    expenses:  expenses  || [],
    resumen: {
      totalIngresosMem,
      totalIngresosRes,
      totalIngresos,
      totalEgresos,
      balance,
    },
  })
}
