'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Stats = {
  totalBookings: number
  todayBookings: number
  totalUsers: number
  monthIncome: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalBookings: 0, todayBookings: 0, totalUsers: 0, monthIncome: 0 })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const monthStart = today.slice(0, 7) + '-01'

      const [
        { count: totalBookings },
        { count: todayBookings },
        { count: totalUsers },
        { data: incomeData },
        { data: recent },
      ] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('start_time', today).eq('status', 'confirmed'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount').eq('type', 'income').gte('date', monthStart),
        supabase.from('bookings').select('*, rooms(name), profiles(full_name)').eq('status', 'confirmed').order('start_time', { ascending: false }).limit(5),
      ])

      const monthIncome = (incomeData || []).reduce((s: number, t: any) => s + t.amount, 0)

      setStats({
        totalBookings: totalBookings || 0,
        todayBookings: todayBookings || 0,
        totalUsers: totalUsers || 0,
        monthIncome,
      })
      setRecentBookings(recent || [])
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Reservas hoy', value: stats.todayBookings, icon: '📅', color: 'bg-blue-50 text-blue-700' },
    { label: 'Reservas totales', value: stats.totalBookings, icon: '📋', color: 'bg-purple-50 text-purple-700' },
    { label: 'Usuarios', value: stats.totalUsers, icon: '👥', color: 'bg-amber-50 text-amber-700' },
    { label: 'Ingresos del mes', value: `$${stats.monthIncome.toLocaleString('es-AR')}`, icon: '💰', color: 'bg-green-50 text-green-700' },
  ]

  const quickLinks = [
    { href: '/admin/finances', label: 'Agregar movimiento', desc: 'Registrar ingreso o egreso', icon: '💰' },
    { href: '/admin/rooms', label: 'Gestionar salas', desc: 'Agregar o editar salas', icon: '🏢' },
    { href: '/admin/users', label: 'Ver usuarios', desc: 'Membresías y cuentas', icon: '👥' },
    { href: '/calendar', label: 'Ver calendario', desc: 'Todas las reservas', icon: '📅' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de administración</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${c.color}`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Accesos rápidos */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all"
              >
                <span className="text-2xl mb-2 block">{l.icon}</span>
                <p className="font-medium text-gray-900 text-sm">{l.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Últimas reservas */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Últimas reservas</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Cargando...</div>
            ) : recentBookings.length === 0 ? (
              <div className="p-6 text-center text-gray-400">Sin reservas</div>
            ) : recentBookings.map(b => (
              <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {(b.rooms?.name || 'Sala').toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.profiles?.full_name} · {new Date(b.start_time).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Confirmada</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
