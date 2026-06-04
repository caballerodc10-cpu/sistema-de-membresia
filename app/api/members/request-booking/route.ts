import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { room_id: roomIdBody, plan_name, start_time, end_time, notes } = body

    if (!start_time || !end_time) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Obtener perfil + membresía (por user_id o por nombre)
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    let membership: any = null
    const { data: memById } = await admin
      .from('memberships')
      .select('id, user_name, hours_total, hours_used, plan')
      .eq('user_id', user.id)
      .maybeSingle()
    membership = memById

    if (!membership && profile?.full_name) {
      const { data: memByName } = await admin
        .from('memberships')
        .select('id, user_name, hours_total, hours_used, plan')
        .eq('user_name', profile.full_name)
        .maybeSingle()
      membership = memByName
    }

    const userName = membership?.user_name || profile?.full_name || user.email || ''

    // Resolver room_id: prioridad → body → plan de la membresía → plan_name del body
    let room_id = roomIdBody || ''

    if (!room_id) {
      const planToSearch = plan_name || membership?.plan
      if (planToSearch) {
        const { data: room } = await admin
          .from('rooms')
          .select('id')
          .ilike('name', planToSearch)
          .maybeSingle()
        room_id = room?.id || ''
      }
    }

    if (!room_id) {
      return NextResponse.json({ error: 'No se pudo determinar la sala. Contactá al administrador.' }, { status: 400 })
    }

    // Calcular duración
    const duracionHoras = (new Date(end_time).getTime() - new Date(start_time).getTime()) / 3600000
    if (duracionHoras <= 0) {
      return NextResponse.json({ error: 'Horario inválido' }, { status: 400 })
    }

    // Verificar horas disponibles
    if (membership && membership.hours_total > 0) {
      const disponibles = membership.hours_total - membership.hours_used
      if (duracionHoras > disponibles) {
        return NextResponse.json({
          error: `Solo tenés ${disponibles.toFixed(1)}hs disponibles. Esta reserva requiere ${duracionHoras}hs.`
        }, { status: 400 })
      }
    }

    // Verificar solapamiento
    const { data: existing } = await admin
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('room_id', room_id)
      .in('status', ['confirmed'])
      .lt('start_time', end_time)
      .gt('end_time', start_time)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'La sala ya tiene una reserva confirmada en ese horario.' }, { status: 409 })
    }

    // Insertar solicitud
    const { data: booking, error: insertError } = await admin
      .from('bookings')
      .insert({
        user_id: user.id,
        room_id,
        start_time,
        end_time,
        notes: notes || null,
        status: 'pending',
        precio_total: 0,
        monto_pagado: 0,
        monto_sena: 0,
        medio_pago: 'membresia',
        tipo_cliente: 'miembro',
        user_name: userName,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, booking })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
