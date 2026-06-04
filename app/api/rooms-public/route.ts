import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

// Devuelve la lista de salas — pública, sin datos sensibles
export async function GET() {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('rooms')
    .select('id, name, capacity')
    .order('name')

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}
