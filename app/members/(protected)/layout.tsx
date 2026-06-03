import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import MembersHeader from '../MembersHeader'

export const metadata = { title: 'Oruga Members' }

export default async function MembersProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/members/login')

  const admin = createAdminSupabaseClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const userName = profile?.full_name || user.email || ''

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <MembersHeader isAdmin={isAdmin} userName={userName} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
