'use client'

import { useEffect, useState } from 'react'

type Registro = {
  id: string; full_name: string; email: string; telefono: string | null
  tipo_profesional: string | null; convenio: string | null; matricula: string | null
  sala_preferida: string | null; actividad_empresa: string | null
  estado_registro: string | null; foto_dni_url: string | null
  tiene_bonificacion: boolean; created_at: string
}

const TIPO_LABEL: Record<string, string> = {
  abogado: 'Abogado/a', contador: 'Contador/a', medico: 'Médico/a',
  arquitecto: 'Arquitecto/a', psicologo: 'Psicólogo/a', consultor: 'Consultor/a',
  comunicador: 'Comunicador/a', emprendedor: 'Emprendedor/a', empresa: 'Empresa', otros: 'Otros',
}

const CONVENIO_LABEL: Record<string, string> = {
  ninguno: '', abogado_colegio: 'CAC', cpce_contador: 'CPCE',
  oam: 'OAM', almacen_idiomas: 'Almacén Idiomas', unne: 'UNNe', convenio_otro: 'Otro convenio',
}

const ESTADO: Record<string, { label: string; bg: string; color: string }> = {
  pendiente: { label: 'Pendiente',  bg: '#fef3c7', color: '#92400e' },
  aprobado:  { label: 'Aprobado',   bg: '#dcfce7', color: '#15803d' },
  rechazado: { label: 'Rechazado',  bg: '#fee2e2', color: '#991b1b' },
}

function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MembersRegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('pendiente')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [filtro])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtro) params.set('estado', filtro)
    const res = await fetch('/api/admin/registros?' + params)
    const data = await res.json()
    setRegistros(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function cambiarEstado(id: string, estado: string) {
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
    await fetch('/api/admin/registros', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notas_admin: notas[id] }),
    })
    await load()
  }

  const pendientes = registros.filter(r => !filtro || r.estado_registro === filtro).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a2332' }}>Registros de usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pendientes} {filtro || 'total'}</p>
        </div>
        {/* Filtro de estado */}
        <div className="flex gap-1.5">
          {[
            { v: 'pendiente', label: '🕐 Pendientes' },
            { v: 'aprobado',  label: '✅ Aprobados' },
            { v: 'rechazado', label: '✕ Rechazados' },
            { v: '',          label: 'Todos' },
          ].map(f => (
            <button key={f.v} onClick={() => setFiltro(f.v)}
              className={`text-xs px-3 py-2 rounded-xl font-semibold transition-colors ${filtro === f.v ? 'text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
              style={filtro === f.v ? { background: '#1a2332' } : {}}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : registros.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-gray-500 font-medium">
            {filtro === 'pendiente' ? 'No hay registros pendientes' : 'Sin resultados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map(r => {
            const estadoInfo = ESTADO[r.estado_registro || 'pendiente'] || ESTADO.pendiente
            const isOpen = expandido === r.id
            const convenioLabel = CONVENIO_LABEL[r.convenio || '']

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Nombre y badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-900">{r.full_name || '—'}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: estadoInfo.bg, color: estadoInfo.color }}>
                          {estadoInfo.label}
                        </span>
                        {r.tipo_profesional && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {TIPO_LABEL[r.tipo_profesional] || r.tipo_profesional}
                          </span>
                        )}
                        {convenioLabel && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                            🎫 {convenioLabel}
                          </span>
                        )}
                        {r.tiene_bonificacion && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✅ Bonif.</span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500">{r.email}</p>

                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        {r.telefono && <span>📞 {r.telefono}</span>}
                        {r.sala_preferida && <span>🏢 {r.sala_preferida}</span>}
                        {r.matricula && <span>🏅 Mat: {r.matricula}</span>}
                        <span>🕐 {fmtFecha(r.created_at)}</span>
                      </div>
                      {r.actividad_empresa && (
                        <p className="text-xs text-gray-400 italic mt-1">{r.actividad_empresa}</p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {r.estado_registro !== 'aprobado' && (
                        <button onClick={() => cambiarEstado(r.id, 'aprobado')} disabled={saving}
                          className="text-xs px-3 py-1.5 rounded-xl bg-green-100 text-green-700 font-semibold hover:bg-green-200 disabled:opacity-50">
                          ✅ Aprobar
                        </button>
                      )}
                      {r.estado_registro !== 'rechazado' && (
                        <button onClick={() => cambiarEstado(r.id, 'rechazado')} disabled={saving}
                          className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-500 font-medium hover:bg-red-100 disabled:opacity-50">
                          ✕ Rechazar
                        </button>
                      )}
                      {r.estado_registro === 'aprobado' && (
                        <a href="/members/admin"
                          className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                          style={{ background: '#1a2332' }}>
                          + Membresía
                        </a>
                      )}
                      {r.telefono && (
                        <a href={`https://wa.me/549${r.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(r.full_name || '')}!%20Te%20contactamos%20desde%20Oruga%20Cowork%20🌿`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                          style={{ background: '#25D366' }}>
                          WA
                        </a>
                      )}
                      <button onClick={() => setExpandido(isOpen ? null : r.id)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">
                        {isOpen ? 'Cerrar' : 'Ver más'}
                      </button>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        {r.foto_dni_url && (
                          <a href={r.foto_dni_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-blue-600 hover:bg-gray-100 w-fit">
                            🪪 Ver foto del DNI
                          </a>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-semibold">Notas internas</label>
                        <div className="flex gap-2">
                          <input type="text"
                            value={notas[r.id] ?? ''}
                            onChange={e => setNotas(n => ({ ...n, [r.id]: e.target.value }))}
                            placeholder="Notas sobre este usuario..."
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800"
                          />
                          <button onClick={() => guardarNotas(r.id)}
                            className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
                            style={{ background: '#1a2332' }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
