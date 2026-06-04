import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Verificar que es admin
    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const mesHoy = new Date().toISOString().slice(0, 7)
    const hoy = new Date()
    const en7dias = new Date(hoy)
    en7dias.setDate(hoy.getDate() + 7)

    // Últimas 48hs para detectar registros nuevos
    const hace48hs = new Date(hoy.getTime() - 48 * 3600000).toISOString()

    const [{ data: mems }, { data: pays }, { data: nuevosPerfiles }] = await Promise.all([
      admin.from('memberships').select('*'),
      admin.from('payments')
        .select('membership_id, monto')
        .gte('fecha', mesHoy + '-01')
        .lte('fecha', mesHoy + '-31'),
      admin.from('profiles')
        .select('id, full_name, email, created_at')
        .gte('created_at', hace48hs)
        .eq('role', 'user'),
    ])

    const cobradoPor: Record<string, number> = {}
    for (const p of pays || []) {
      cobradoPor[p.membership_id] = (cobradoPor[p.membership_id] || 0) + p.monto
    }

    type Alerta = {
      id: string; user_name: string; plan: string; telefono: string | null
      tipo: 'horas_bajas' | 'sin_horas' | 'pago_pendiente' | 'vence_pronto'
      detalle: string; hours_total?: number; hours_used?: number; monto_pendiente?: number
    }

    const lista: Alerta[] = []

    for (const m of mems || []) {
      const pctUsado = m.hours_total > 0 ? m.hours_used / m.hours_total : null
      const horasRestantes = m.hours_total > 0 ? m.hours_total - m.hours_used : null
      const cobrado = cobradoPor[m.id] || 0
      const saldo = Math.max(0, (m.monto_mensual || 0) - cobrado)

      if (pctUsado !== null && pctUsado >= 0.8) {
        lista.push({
          id: m.id + '_h', user_name: m.user_name, plan: m.plan, telefono: m.telefono || null,
          tipo: (horasRestantes ?? 0) <= 0 ? 'sin_horas' : 'horas_bajas',
          detalle: (horasRestantes ?? 0) <= 0
            ? `Agotó sus ${m.hours_total}hs del plan ${m.plan}`
            : `Le quedan ${horasRestantes}hs de ${m.hours_total}hs`,
          hours_total: m.hours_total, hours_used: m.hours_used,
        })
      }

      if (saldo > 0 && m.monto_mensual > 0) {
        lista.push({
          id: m.id + '_p', user_name: m.user_name, plan: m.plan, telefono: m.telefono || null,
          tipo: 'pago_pendiente',
          detalle: `Debe $${Math.round(saldo).toLocaleString('es-AR')} · cuota ${mesHoy}`,
          monto_pendiente: saldo,
        })
      }

      if (m.valid_until) {
        const vence = new Date(m.valid_until)
        if (vence >= hoy && vence <= en7dias) {
          lista.push({
            id: m.id + '_v', user_name: m.user_name, plan: m.plan, telefono: m.telefono || null,
            tipo: 'vence_pronto',
            detalle: `Vence el ${vence.toLocaleDateString('es-AR')} · ${m.plan}`,
          })
        }
      }
    }

    // Nuevos registros sin membresía (últimas 48hs)
    const idsConMembresia = new Set((mems || []).map(m => m.user_id).filter(Boolean))
    for (const p of nuevosPerfiles || []) {
      if (!idsConMembresia.has(p.id)) {
        const haceMinutos = Math.round((Date.now() - new Date(p.created_at).getTime()) / 60000)
        const haceTexto = haceMinutos < 60
          ? `hace ${haceMinutos} min`
          : `hace ${Math.round(haceMinutos / 60)} hs`
        lista.unshift({
          id: p.id + '_nuevo',
          user_name: p.full_name || p.email || 'Nuevo usuario',
          plan: '—',
          telefono: null,
          tipo: 'nuevo_registro' as any,
          detalle: `${p.email} · Se registró ${haceTexto} · Sin membresía asignada`,
        })
      }
    }

    return NextResponse.json(lista)
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
