'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type Profile = {
  id: string
  full_name: string
  email: string
  role: string
  telefono?: string
  telefono_emergencia?: string
  pais_provincia?: string
  tipo_acceso?: string
  actividad_empresa?: string
  facturacion_nombre?: string
  dni_cuil?: string
  foto_dni_url?: string
  foto_matricula_url?: string
  acuerdo_convivencia?: boolean
  registro_completo?: boolean
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  user: 'Usuario',
  abogado_colegio: 'Abogado Colegio',
}

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-gray-100 text-gray-600',
  abogado_colegio: 'bg-blue-100 text-blue-700',
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Profile | null>(null)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
  const [memberships, setMemberships] = useState<Set<string>>(new Set())
    load()
  }, [])

  async function load() {
    const res = await fetch('/api/admin/profiles')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])

    // Cargar membresias activas para detectar miembros activos
    const supabase = createClient()
    const { data: mems } = await supabase
      .from('memberships')
      .select('user_id')
      .gt('hours_total', 0)
    const memSet = new Set((mems || []).map((m: any) => m.user_id).filter(Boolean))
    setMemberships(memSet)
    setLoading(false)
  }

  async function cambiarRol(user: Profile, newRole: string) {
    if (!confirm(`¿Cambiar a ${user.full_name} a rol "${ROLE_LABEL[newRole] || newRole}"?`)) return
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    if (selected?.id === user.id) setSelected(s => s ? { ...s, role: newRole } : s)
  }

  const filtrados = users.filter(u => {
    if (filtro === 'todos') return true
    if (filtro === 'usuarios') return u.role === 'user'
    if (filtro === 'abogados') return u.role === 'abogado_colegio'
    if (filtro === 'contadores') {
      const ta = (u.tipo_acceso || '').toLowerCase()
      const ae = (u.actividad_empresa || '').toLowerCase()
      return ta.includes('contador') || ta.includes('cpce') || ae.includes('contador') || ae.includes('cpce')
    }
    if (filtro === 'miembros') return memberships.has(u.id)
    if (filtro === 'oame') {
      const ta = (u.tipo_acceso || '').toLowerCase()
      const ae = (u.actividad_empresa || '').toLowerCase()
      return ta.includes('oame') || ae.includes('oame')
    }
    if (filtro === 'admins') return u.role === 'admin'
    return true
  })

  const conteos = {
    todos: users.length,
    usuarios: users.filter(u => u.role === 'user').length,
    abogados: users.filter(u => u.role === 'abogado_colegio').length,
    contadores: users.filter(u => {
      const ta = (u.tipo_acceso || '').toLowerCase()
      const ae = (u.actividad_empresa || '').toLowerCase()
      return ta.includes('contador') || ta.includes('cpce') || ae.includes('contador') || ae.includes('cpce')
    }).length,
    miembros: users.filter(u => memberships.has(u.id)).length,
    oame: users.filter(u => {
      const ta = (u.tipo_acceso || '').toLowerCase()
      const ae = (u.actividad_empresa || '').toLowerCase()
      return ta.includes('oame') || ae.includes('oame')
    }).length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  function exportarClientesExcel() {
    const ROLE_LABEL_ES: Record<string, string> = {
      admin: 'Admin',
      user: 'Usuario',
      abogado_colegio: 'Abogado Colegio',
    }

    const headers = [
      'Nombre completo', 'Email', 'Rol', 'Teléfono', 'DNI / CUIL',
      'Tipo de acceso', 'Actividad / Empresa', 'Facturación a nombre de',
      'País / Provincia', 'Contacto emergencia', 'Acuerdo convivencia',
      'DNI cargado', 'Matrícula cargada', 'Fecha de registro',
    ]

    const rows = users.map(u => [
      u.full_name || '',
      u.email || '',
      ROLE_LABEL_ES[u.role] || u.role,
      u.telefono || '',
      u.dni_cuil || '',
      u.tipo_acceso || '',
      u.actividad_empresa || '',
      u.facturacion_nombre || '',
      u.pais_provincia || '',
      u.telefono_emergencia || '',
      u.acuerdo_convivencia ? 'Sí' : 'No',
      u.foto_dni_url ? 'Sí' : 'No',
      u.foto_matricula_url ? 'Sí' : 'No',
      u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    ])

    const wb = XLSX.utils.book_new()
    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Estilo de encabezado (bold)
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellAddr]) {
        ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: '0A2744' } } }
      }
    }

    ws['!cols'] = [
      { wch: 30 }, { wch: 35 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
      { wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
      { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 18 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes registrados')

    // Hoja de resumen por rol
    const resumenData = [
      ['RESUMEN DE USUARIOS', ''],
      ['', ''],
      ['Total registrados', users.length],
      ['Usuarios', users.filter(u => u.role === 'user').length],
      ['Abogados Colegio', users.filter(u => u.role === 'abogado_colegio').length],
      ['Admins', users.filter(u => u.role === 'admin').length],
      ['', ''],
      ['Con DNI cargado', users.filter(u => u.foto_dni_url).length],
      ['Con matrícula cargada', users.filter(u => u.foto_matricula_url).length],
      ['Aceptaron acuerdo', users.filter(u => u.acuerdo_convivencia).length],
      ['', ''],
      ['Exportado el', new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })],
    ]
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    wsResumen['!cols'] = [{ wch: 28 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Oruga-Clientes-${fecha}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0a2744' }}>Usuarios registrados</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{users.length} en total</span>
          <button onClick={exportarClientesExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'usuarios', label: '👤 Usuarios' },
          { key: 'abogados', label: '⚖️ Conv. Abogados' },
          { key: 'contadores', label: '📊 Conv. Contadores' },
          { key: 'miembros', label: '💎 Miembros Activos' },
          { key: 'oame', label: '🏛 Conv. OAME' },
          { key: 'admins', label: '🔑 Admins' },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${filtro === f.key ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            style={filtro === f.key ? { background: '#0a2744' } : {}}>
            {f.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filtro === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {conteos[f.key as keyof typeof conteos]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">Sin usuarios en esta categoría</div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map(u => (
            <div key={u.id}
              onClick={() => setSelected(u)}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all">

              {/* Avatar */}
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                style={{ background: '#0a2744' }}>
                {(u.full_name || u.email || '?')[0].toUpperCase()}
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{u.full_name || '—'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'abogado_colegio' ? '⚖️ Abogado Colegio' : ROLE_LABEL[u.role] || u.role}
                  </span>
                  {u.foto_dni_url && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">📄 DNI</span>}
                  {u.foto_matricula_url && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">⚖️ Matrícula</span>}
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                  <span>{u.email}</span>
                  {u.telefono && <span>📞 {u.telefono}</span>}
                  {u.dni_cuil && <span>DNI: {u.dni_cuil}</span>}
                  {u.actividad_empresa && <span>· {u.actividad_empresa}</span>}
                </div>
              </div>

              {/* Fecha */}
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-blue-500 mt-1">Ver ficha →</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between p-5 rounded-t-2xl" style={{ background: '#0a2744' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-lg">
                  {(selected.full_name || selected.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{selected.full_name || '—'}</p>
                  <p className="text-blue-200 text-xs">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-blue-200 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-5">

              {/* Rol */}
              <div className="flex items-center justify-between">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${ROLE_COLOR[selected.role] || 'bg-gray-100 text-gray-600'}`}>
                  {selected.role === 'abogado_colegio' ? '⚖️ Abogado Colegio' : ROLE_LABEL[selected.role] || selected.role}
                </span>
                <span className="text-xs text-gray-400">
                  Registrado el {new Date(selected.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Datos personales */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Datos personales</p>
                <div className="space-y-2">
                  {[
                    { label: 'Nombre completo', value: selected.full_name },
                    { label: 'DNI / CUIL', value: selected.dni_cuil },
                    { label: 'Teléfono', value: selected.telefono },
                    { label: 'Contacto emergencia', value: selected.telefono_emergencia },
                    { label: 'País / Provincia', value: selected.pais_provincia },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-800 text-right max-w-[55%]">{value}</span>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Actividad */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Actividad y facturación</p>
                <div className="space-y-2">
                  {[
                    { label: 'Tipo de acceso', value: selected.tipo_acceso },
                    { label: 'Actividad / empresa', value: selected.actividad_empresa },
                    { label: 'Facturación a nombre de', value: selected.facturacion_nombre },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-800 text-right max-w-[55%]">{value}</span>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Fotos de documentos */}
              {(selected.foto_dni_url || selected.foto_matricula_url) && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Documentos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.foto_dni_url && (
                      <a href={selected.foto_dni_url} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video relative group">
                          <img src={selected.foto_dni_url} alt="DNI" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100">Abrir foto</span>
                          </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">📄 DNI (frente)</p>
                      </a>
                    )}
                    {selected.foto_matricula_url && (
                      <a href={selected.foto_matricula_url} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video relative group">
                          <img src={selected.foto_matricula_url} alt="Matrícula" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100">Abrir foto</span>
                          </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">⚖️ Matrícula</p>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Sin documentos */}
              {!selected.foto_dni_url && !selected.foto_matricula_url && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  ⚠ Este usuario no cargó fotos de documentos
                </div>
              )}

              {/* Acuerdo */}
              <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${selected.acuerdo_convivencia ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {selected.acuerdo_convivencia ? '✅ Aceptó el acuerdo de convivencia' : '❌ No aceptó el acuerdo de convivencia'}
              </div>

              {/* Acciones de rol */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Cambiar rol</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { role: 'user', label: '👤 Usuario' },
                    { role: 'abogado_colegio', label: '⚖️ Abogado Colegio' },
                    { role: 'admin', label: '🔑 Admin' },
                  ].map(({ role, label }) => (
                    <button key={role} onClick={() => cambiarRol(selected, role)}
                      disabled={selected.role === role}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40
                        ${selected.role === role ? 'border-transparent text-white' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      style={selected.role === role ? { background: '#0a2744' } : {}}>
                      {label} {selected.role === role ? '(actual)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp */}
              {selected.telefono && (
                <a
                  href={`https://wa.me/549${selected.telefono.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: '#25D366' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Escribir por WhatsApp
                </a>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
