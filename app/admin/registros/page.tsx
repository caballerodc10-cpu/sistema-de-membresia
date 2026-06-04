'use client'

import { useEffect, useState } from 'react'

type Registro = {
  id: string
  full_name: string
  email: string
  telefono: string | null
  pais_provincia: string | null
  tipo_profesional: string | null
  tipo_acceso: string | null
  convenio: string | null
  matricula: string | null
  sala_preferida: string | null
  actividad_empresa: string | null
  facturacion_nombre: string | null
  dni_cuil: string | null
  foto_dni_url: string | null
  tiene_bonificacion: boolean
  estado_registro: string | null
  notas_admin: string | null
  acuerdo_convivencia: boolean
  created_at: string
  role: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  abogado: 'Abogado/a', contador: 'Contador/a', medico: 'Médico/a',
  arquitecto: 'Arquitecto/a', psicologo: 'Psicólogo/a', consultor: 'Consultor/a',
  comunicador: 'Comunicador/a', emprendedor: 'Emprendedor/a', empresa: 'Empresa',
  otros: 'Otros',
}

const CONVENIO_LABEL: Record<string, { label: string; color: string }> = {
  ninguno:         { label: 'Sin convenio',          color: 'bg-gray-100 text-gray-600' },
  abogado_colegio: { label: 'CAC – Colegio Abogados',color: 'bg-blue-100 text-blue-700' },
  cpce_contador:   { label: 'CPCE',                  color: 'bg-indigo-100 text-indigo-700' },
  oam:             { label: 'OAM',                   color: 'bg-purple-100 text-purple-700' },
  almacen_idiomas: { label: 'Almacén Idiomas',        color: 'bg-pink-100 text-pink-700' },
  unne:            { label: 'UNNe',                  color: 'bg-orange-100 text-orange-700' },
  convenio_otro:   { label: 'Otro convenio',          color: 'bg-teal-100 text-teal-700' },
}

const ESTADO_INFO: Record<string, { label: string; bg: string; color: string }> = {
  pendiente: { label: 'Pendiente',  bg: '#fef3c7', color: '#92400e' },
  aprobado:  { label: 'Aprobado',   bg: '#dcfce7', color: '#15803d' },
  rechazado: { label: 'Rechazado',  bg: '#fee2e2', color: '#991b1b' },
}

function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function RegistrosAdminPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroConvenio, setFiltroConvenio] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSala, setFiltroSala] = useState('')

  // Edición de notas
  const [notasEdit, setNotasEdit] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [filtroEstado, filtroConvenio, filtroTipo, filtroSala])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroEstado)   params.set('estado', filtroEstado)
    if (filtroConvenio) params.set('convenio', filtroConvenio)
    if (filtroTipo)     params.set('tipo', filtroTipo)
    if (filtroSala)     params.set('sala', filtroSala)
    const res = await fetch('/api/admin/registros?' + params)
    const data = await res.json()
    setRegistros(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function actualizarEstado(id: string, estado: string) {
    setSaving(true)
    await fetch('/api/admin/registros', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado_registro: estado }),
    })
    await load()
    setSaving(false)
  }

  async function guardarNotas(id: string) {
    setSaving(true)
    await fetch('/api/admin/registros', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notas_admin: notasEdit[id] || '' }),
    })
    await load()
    setSaving(false)
  }

  async function toggleBonificacion(r: Registro) {
    await fetch('/api/admin/registros', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, tiene_bonificacion: !r.tiene_bonificacion }),
    })
    await load()
  }

  // Filtro local por búsqueda de texto
  const filtrados = registros.filter(r => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.actividad_empresa?.toLowerCase().includes(q) ||
      r.matricula?.toLowerCase().includes(q)
    )
  })

  // Métricas rápidas (sobre todos los registros, no solo filtrados)
  const pendientes = registros.filter(r => r.estado_registro === 'pendiente').length
  const aprobados  = registros.filter(r => r.estado_registro === 'aprobado').length
  const conBonif   = registros.filter(r => r.tiene_bonificacion).length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0a2744' }}>Registros</h1>
        <p className="text-sm text-gray-500 mt-0.5">{registros.length} usuarios registrados</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',         value: registros.length, color: '#0a2744' },
          { label: 'Pendientes',    value: pendientes,       color: '#d97706' },
          { label: 'Aprobados',     value: aprobados,        color: '#16a34a' },
          { label: 'Con bonif.',    value: conBonif,         color: '#7c3aed' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className="text-2xl font-black" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, email, matrícula..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none shadow-sm" />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filtroConvenio} onChange={e => setFiltroConvenio(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none">
          <option value="">Todos los convenios</option>
          {Object.entries(CONVENIO_LABEL).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select value={filtroSala} onChange={e => setFiltroSala(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none">
          <option value="">Todas las salas</option>
          {['Alocasia','Begonia','Pothus 2','Peperomia','Calathea','Pothus','Bromelia','Pandurata'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {(busqueda || filtroEstado || filtroTipo || filtroConvenio || filtroSala) && (
          <button onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroTipo(''); setFiltroConvenio(''); setFiltroSala('') }}
            className="text-xs px-3 py-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
            Limpiar
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="h-40 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
          No hay registros que coincidan con los filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => {
            const estadoInfo = ESTADO_INFO[r.estado_registro || 'pendiente'] || ESTADO_INFO.pendiente
            const convenioInfo = CONVENIO_LABEL[r.convenio || 'ninguno'] || CONVENIO_LABEL.ninguno
            const isOpen = expandido === r.id

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Fila principal */}
                <div className="p-4 flex items-start gap-3 flex-wrap">
                  {/* Info básica */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="font-bold text-gray-900">{r.full_name || '—'}</p>

                      {/* Estado */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: estadoInfo.bg, color: estadoInfo.color }}>
                        {estadoInfo.label}
                      </span>

                      {/* Tipo profesional */}
                      {r.tipo_profesional && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {TIPO_LABEL[r.tipo_profesional] || r.tipo_profesional}
                        </span>
                      )}

                      {/* Convenio */}
                      {r.convenio && r.convenio !== 'ninguno' && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${convenioInfo.color}`}>
                          🎫 {convenioInfo.label}
                        </span>
                      )}

                      {/* Bonificación */}
                      {r.tiene_bonificacion && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          ✅ Bonif. validada
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">{r.email}</p>

                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                      {r.telefono && <span>📞 {r.telefono}</span>}
                      {r.sala_preferida && <span>🏢 Prefiere: {r.sala_preferida}</span>}
                      {r.matricula && <span>🏅 Mat: {r.matricula}</span>}
                      <span>🕐 {fmtFecha(r.created_at)}</span>
                    </div>

                    {r.actividad_empresa && (
                      <p className="text-xs text-gray-500 mt-1 italic">{r.actividad_empresa}</p>
                    )}
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {r.estado_registro !== 'aprobado' && (
                      <button onClick={() => actualizarEstado(r.id, 'aprobado')}
                        disabled={saving}
                        className="text-xs px-3 py-1.5 rounded-xl bg-green-100 text-green-700 font-semibold hover:bg-green-200 disabled:opacity-50">
                        ✅ Aprobar
                      </button>
                    )}
                    {r.estado_registro !== 'rechazado' && (
                      <button onClick={() => actualizarEstado(r.id, 'rechazado')}
                        disabled={saving}
                        className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-500 font-medium hover:bg-red-100 disabled:opacity-50">
                        ✕ Rechazar
                      </button>
                    )}
                    {r.estado_registro === 'aprobado' && (
                      <a href={`/members/admin`}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                        style={{ background: '#0a2744' }}>
                        + Membresía
                      </a>
                    )}
                    <button onClick={() => setExpandido(isOpen ? null : r.id)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200">
                      {isOpen ? 'Cerrar' : 'Ver todo'}
                    </button>
                  </div>
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50/50">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos personales</p>
                        <div className="space-y-1 text-xs">
                          {r.pais_provincia && <div className="flex gap-2"><span className="text-gray-400 w-28">Provincia:</span><span>{r.pais_provincia}</span></div>}
                          {r.tipo_acceso    && <div className="flex gap-2"><span className="text-gray-400 w-28">Tipo acceso:</span><span>{r.tipo_acceso}</span></div>}
                          {r.facturacion_nombre && <div className="flex gap-2"><span className="text-gray-400 w-28">Facturación:</span><span>{r.facturacion_nombre}</span></div>}
                          {r.dni_cuil       && <div className="flex gap-2"><span className="text-gray-400 w-28">DNI/CUIL:</span><span>{r.dni_cuil}</span></div>}
                          {r.matricula      && <div className="flex gap-2"><span className="text-gray-400 w-28">Matrícula:</span><span className="font-semibold text-blue-700">{r.matricula}</span></div>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profesional / Convenio</p>
                        <div className="space-y-1 text-xs">
                          {r.tipo_profesional && <div className="flex gap-2"><span className="text-gray-400 w-28">Profesión:</span><span className="font-semibold">{TIPO_LABEL[r.tipo_profesional] || r.tipo_profesional}</span></div>}
                          <div className="flex gap-2"><span className="text-gray-400 w-28">Convenio:</span>
                            <span className={`font-semibold px-1.5 py-0.5 rounded ${convenioInfo.color}`}>{convenioInfo.label}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-gray-400 w-28">Bonificación:</span>
                            <button onClick={() => toggleBonificacion(r)}
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${r.tiene_bonificacion ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}>
                              {r.tiene_bonificacion ? '✅ Validada (clic para quitar)' : 'No validada (clic para aprobar)'}
                            </button>
                          </div>
                          {r.sala_preferida && <div className="flex gap-2"><span className="text-gray-400 w-28">Sala preferida:</span><span className="font-semibold">{r.sala_preferida}</span></div>}
                        </div>
                      </div>
                    </div>

                    {/* Foto DNI */}
                    {r.foto_dni_url && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Foto DNI</p>
                        <a href={r.foto_dni_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-blue-600 hover:text-blue-700">
                          🪪 Ver foto del DNI
                        </a>
                      </div>
                    )}

                    {/* WhatsApp rápido */}
                    {r.telefono && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contacto</p>
                        <a href={`https://wa.me/549${r.telefono.replace(/\D/g, '')}?text=Hola ${encodeURIComponent(r.full_name || '')}! Te contactamos desde Oruga Cowork 🌿`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                          style={{ background: '#25D366' }}>
                          💬 WhatsApp
                        </a>
                      </div>
                    )}

                    {/* Notas admin */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas internas</p>
                      <div className="flex gap-2">
                        <input type="text"
                          value={notasEdit[r.id] ?? (r.notas_admin || '')}
                          onChange={e => setNotasEdit(n => ({ ...n, [r.id]: e.target.value }))}
                          placeholder="Notas internas sobre este registro..."
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 bg-white"
                        />
                        <button onClick={() => guardarNotas(r.id)} disabled={saving}
                          className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                          style={{ background: '#0a2744' }}>
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
