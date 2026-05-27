import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ role: 'guest' })

    const admin = createAdminSupabaseClient()
    const { data } = await admin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      role: data?.role || 'user',
      name: data?.full_name || '',
      email: user.email,
    })
  } catch {
    return NextResponse.json({ role: 'user' })
  }
}
