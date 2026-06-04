'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

// ─── Datos de dominio ─────────────────────────────────────────────────────────
const TIPOS_PROFESIONAL = [
  { value: 'abogado',       label: 'Abogado/a',                    necesitaMatricula: true  },
  { value: 'contador',      label: 'Contador/a - CPN',             necesitaMatricula: true  },
  { value: 'medico',        label: 'Médico/a - Prof. de salud',    necesitaMatricula: true  },
  { value: 'arquitecto',    label: 'Arquitecto/a - Ingeniero/a',   necesitaMatricula: true  },
  { value: 'psicologo',     label: 'Psicólogo/a - Terapeuta',      necesitaMatricula: true  },
  { value: 'consultor',     label: 'Consultor/a - Coach',          necesitaMatricula: false },
  { value: 'comunicador',   label: 'Periodista - Comunicador/a',   necesitaMatricula: false },
  { value: 'emprendedor',   label: 'Emprendedor/a',                necesitaMatricula: false },
  { value: 'empresa',       label: 'Empresa / Startup / ONG',      necesitaMatricula: false },
  { value: 'otros',         label: 'Otros',                        necesitaMatricula: false },
]

const CONVENIOS = [
  { value: 'ninguno',          label: 'No tengo convenio',                     desc: 'Precio de lista',             bonif: false },
  { value: 'abogado_colegio',  label: 'Colegio de Abogados de Corrientes',     desc: '1 hora gratis por semana',    bonif: true  },
  { value: 'cpce_contador',    label: 'CPCE – Ciencias Económicas',            desc: '10-15% de descuento',         bonif: true  },
  { value: 'oam',              label: 'OAM – Org. de Abogados del Mercosur',   desc: '15% en todas las salas',      bonif: true  },
  { value: 'almacen_idiomas',  label: 'Almacén de Idiomas',                    desc: '20% en salas privadas',       bonif: true  },
  { value: 'unne',             label: 'UNNe – Univ. Nacional del Nordeste',    desc: '15% en salas privadas',       bonif: true  },
  { value: 'convenio_otro',    label: 'Otro convenio con Oruga',               desc: '10% en todas las salas',      bonif: true  },
]

const SALAS = [
  { value: '',            label: 'Sin preferencia / La que esté disponible' },
  { value: 'Alocasia',    label: 'Alocasia — hasta 3 personas (reuniones ejecutivas)' },
  { value: 'Begonia',     label: 'Begonia — hasta 5 personas' },
  { value: 'Pothus 2',    label: 'Pothus 2 — hasta 5 personas' },
  { value: 'Peperomia',   label: 'Peperomia — hasta 8 personas' },
  { value: 'Calathea',    label: 'Calathea — hasta 12 personas (capacitaciones)' },
  { value: 'Pothus',      label: 'Pothus — hasta 20 personas (conferencias)' },
  { value: 'Bromelia',    label: 'Bromelia / SUM — hasta 30 personas (eventos)' },
  { value: 'Pandurata',   label: 'Pandurata — espacio compartido coworking' },
]

const TIPOS_ACCESO = ['Profesional Independiente', 'Grupo o Empresa', 'Otros']

const ACUERDO = [
  'Fomentar el respeto entre las personas que se encuentran en el espacio, controlando el volumen de la voz sin alterar la tranquilidad de los demás coworkers.',
  'Cuidar las instalaciones y la limpieza de las salas y los espacios comunes como baños, cocina y patio, cumpliendo las normas convencionales de higiene.',
  'A la hora de almorzar o fumar, hacerlo en los espacios comunes correspondientes.',
  'Ser precavido con los objetos personales, evitando pérdidas y obstrucciones en los espacios.',
]

// ─── Componente foto ──────────────────────────────────────────────────────────
function FotoUpload({ label, sublabel, value, onChange, required }: {
  label: string; sublabel?: string; value: File | null; onChange: (f: File) => void; required?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const preview = value ? URL.createObjectURL(value) : null
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {sublabel && <p className="text-xs text-gray-400 mb-2">{sublabel}</p>}
      <div
        onClick={() => ref.current?.click()}
        className={`relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
          ${preview ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
              <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full">✓ Cargada · Tocá para cambiar</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-3xl mb-1">📷</span>
            <span className="text-xs text-gray-500 font-medium">Tocá para subir la foto</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]) }} />
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fotoDni, setFotoDni] = useState<File | null>(null)

  const [form, setForm] = useState({
    // Paso 1 — datos personales
    full_name: '',
    email: '',
    password: '',
    pais_provincia: '',
    telefono: '',
    telefono_emergencia: '',

    // Paso 2 — perfil profesional
    tipo_profesional: '',
    tipo_acceso: '',
    convenio: 'ninguno',
    matricula: '',
    sala_preferida: '',
    actividad_empresa: '',

    // Paso 3 — facturación y acuerdo
    facturacion_nombre: '',
    dni_cuil: '',
    acuerdo_convivencia: false,
  })

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const tipoProfSeleccionado = TIPOS_PROFESIONAL.find(t => t.value === form.tipo_profesional)
  const convenioSeleccionado = CONVENIOS.find(c => c.value === form.convenio)
  const necesitaMatricula    = tipoProfSeleccionado?.necesitaMatricula ?? false
  const tieneBonificacion    = convenioSeleccionado?.bonif ?? false

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"

  async function handleSubmit() {
    if (!form.acuerdo_convivencia) {
      setError('Debés aceptar el acuerdo de convivencia para continuar.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } }
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Ya existe una cuenta con ese email.'
        : authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const userId = authData.user.id
      let fotoDniUrl = ''
      if (fotoDni) {
        const ext = fotoDni.name.split('.').pop()
        const { data } = await supabase.storage.from('documentos').upload(`${userId}/dni.${ext}`, fotoDni, { upsert: true })
        if (data) {
          const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(data.path)
          fotoDniUrl = urlData.publicUrl
        }
      }

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: form.full_name,
        email: form.email,
        telefono: form.telefono,
        pais_provincia: form.pais_provincia,
        telefono_emergencia: form.telefono_emergencia,
        tipo_acceso: form.tipo_acceso || form.tipo_profesional,
        tipo_profesional: form.tipo_profesional,
        actividad_empresa: form.actividad_empresa,
        convenio: form.convenio,
        matricula: form.matricula || null,
        sala_preferida: form.sala_preferida || null,
        tiene_bonificacion: tieneBonificacion,
        facturacion_nombre: form.facturacion_nombre || form.full_name,
        dni_cuil: form.dni_cuil,
        foto_dni_url: fotoDniUrl,
        acuerdo_convivencia: true,
        registro_completo: true,
        estado_registro: 'pendiente',
        role: 'user',
      })
    }

    router.push('/registro-exitoso')
  }

  const STEPS = ['Datos personales', 'Perfil profesional', 'Facturación y acuerdo']

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #0a2744 0%, #1a3f6f 100%)' }}>
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="relative w-40 h-14 mx-auto mb-2">
            <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga Cowork" fill className="object-contain brightness-0 invert" />
          </div>
          <p className="text-sm" style={{ color: '#c5e84a' }}>Buenos Aires 678 · Corrientes Capital</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h1 className="text-lg font-bold" style={{ color: '#0a2744' }}>Registro Oruga Coworking</h1>
            <p className="text-xs text-gray-400 mt-0.5">Información confidencial · Solo para fines de registro y base de datos.</p>
          </div>

          {/* Progress */}
          <div className="flex border-b border-gray-100">
            {STEPS.map((label, i) => {
              const s = i + 1
              const done = step > s
              const active = step === s
              return (
                <div key={s} className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${active ? 'text-white' : done ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
                  style={active ? { background: '#0a2744' } : {}}>
                  {done ? '✓' : label}
                </div>
              )
            })}
          </div>

          <div className="p-6 space-y-4">

            {/* ── PASO 1: Datos personales ───────────────────────────── */}
            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre y Apellido *</label>
                    <input className={inputClass} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ej: Juan Pérez" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">País / Provincia *</label>
                    <input className={inputClass} value={form.pais_provincia} onChange={e => set('pais_provincia', e.target.value)} placeholder="Ej: Corrientes, Argentina" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono *</label>
                    <input className={inputClass} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="3794123456 (sin 0, sin 15)" type="tel" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Contacto de Emergencia *</label>
                    <input className={inputClass} value={form.telefono_emergencia} onChange={e => set('telefono_emergencia', e.target.value)} placeholder="Nombre y teléfono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                    <input className={inputClass} value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" type="email" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña *</label>
                    <input className={inputClass} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" type="password" />
                  </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

                <button onClick={() => {
                  if (!form.full_name || !form.email || !form.password || !form.telefono || !form.pais_provincia) {
                    setError('Completá todos los campos obligatorios.')
                    return
                  }
                  if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
                  setError(''); setStep(2)
                }}
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: '#0a2744', color: '#c5e84a' }}>
                  Continuar →
                </button>
              </>
            )}

            {/* ── PASO 2: Perfil profesional ─────────────────────────── */}
            {step === 2 && (
              <>
                {/* Tipo profesional */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">¿Cuál es tu tipo de actividad? *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_PROFESIONAL.map(t => (
                      <label key={t.value}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${form.tipo_profesional === t.value ? 'border-blue-400 bg-blue-50 font-semibold text-blue-800' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                        <input type="radio" name="tipo_profesional" value={t.value}
                          checked={form.tipo_profesional === t.value}
                          onChange={() => set('tipo_profesional', t.value)}
                          className="accent-blue-700 shrink-0" />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Matrícula (condicional) */}
                {necesitaMatricula && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">
                      N° de Matrícula / Colegiatura <span className="text-blue-400 font-normal">(requerido para convenios profesionales)</span>
                    </label>
                    <input className={inputClass} value={form.matricula}
                      onChange={e => set('matricula', e.target.value)}
                      placeholder="Ej: 1234, CAC-5678, CPCE-890..." />
                  </div>
                )}

                {/* Convenio */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    ¿Tenés convenio con Oruga Cowork? <span className="text-gray-400 font-normal">(descuentos especiales)</span>
                  </label>
                  <div className="space-y-2">
                    {CONVENIOS.map(c => (
                      <label key={c.value}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.convenio === c.value ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <input type="radio" name="convenio" value={c.value}
                            checked={form.convenio === c.value}
                            onChange={() => set('convenio', c.value)}
                            className="accent-green-700 shrink-0" />
                          <span className="text-sm text-gray-800">{c.label}</span>
                        </div>
                        {c.bonif && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                            {c.desc}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  {tieneBonificacion && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs text-green-700">
                      ✅ <strong>Bonificación aplicable.</strong> El descuento se valida con tu matrícula o credencial del convenio.
                    </div>
                  )}
                </div>

                {/* Sala preferida */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    ¿Tenés preferencia de sala? <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <select className={inputClass} value={form.sala_preferida}
                    onChange={e => set('sala_preferida', e.target.value)}>
                    {SALAS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Descripción actividad */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Describí tu actividad / empresa *</label>
                  <input className={inputClass} value={form.actividad_empresa}
                    onChange={e => set('actividad_empresa', e.target.value)}
                    placeholder="Ej: Estudio jurídico, desarrollador freelance, startup de tecnología..." />
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

                <div className="flex gap-3">
                  <button onClick={() => { setError(''); setStep(1) }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-600">
                    ← Volver
                  </button>
                  <button onClick={() => {
                    if (!form.tipo_profesional || !form.actividad_empresa) {
                      setError('Seleccioná tu tipo de actividad y describila.')
                      return
                    }
                    if (necesitaMatricula && !form.matricula.trim()) {
                      setError('Ingresá tu número de matrícula o colegiatura.')
                      return
                    }
                    setError(''); setStep(3)
                  }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm"
                    style={{ background: '#0a2744', color: '#c5e84a' }}>
                    Continuar →
                  </button>
                </div>
              </>
            )}

            {/* ── PASO 3: Facturación + acuerdo ─────────────────────── */}
            {step === 3 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Razón social / Nombre para factura *</label>
                    <input className={inputClass} value={form.facturacion_nombre}
                      onChange={e => set('facturacion_nombre', e.target.value)}
                      placeholder="Nombre o razón social" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">DNI / CUIL / CUIT *</label>
                    <input className={inputClass} value={form.dni_cuil}
                      onChange={e => set('dni_cuil', e.target.value)}
                      placeholder="Sin guiones ni espacios" />
                  </div>
                </div>

                {/* Tipo de acceso (mantener compatibilidad) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Accedés al coworking como *</label>
                  <div className="space-y-2">
                    {TIPOS_ACCESO.map(op => (
                      <label key={op} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.tipo_acceso === op ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="tipo_acceso" value={op}
                          checked={form.tipo_acceso === op}
                          onChange={() => set('tipo_acceso', op)}
                          className="accent-blue-700" />
                        <span className="text-sm text-gray-700">{op}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <FotoUpload
                  label="Foto del DNI (frente)"
                  sublabel="Sacá una foto clara donde se lean bien el nombre y número."
                  value={fotoDni}
                  onChange={setFotoDni}
                  required
                />

                {/* Resumen del perfil */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs space-y-1.5">
                  <p className="font-semibold text-gray-700 mb-2">Resumen de tu registro:</p>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-28 shrink-0">Tipo:</span>
                    <span className="text-gray-700">{tipoProfSeleccionado?.label || '—'}</span>
                  </div>
                  {form.matricula && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 shrink-0">Matrícula:</span>
                      <span className="text-gray-700">{form.matricula}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-28 shrink-0">Convenio:</span>
                    <span className={tieneBonificacion ? 'text-green-700 font-semibold' : 'text-gray-700'}>
                      {convenioSeleccionado?.label || '—'}
                      {tieneBonificacion && ' ✅'}
                    </span>
                  </div>
                  {form.sala_preferida && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 shrink-0">Sala preferida:</span>
                      <span className="text-gray-700">{form.sala_preferida}</span>
                    </div>
                  )}
                </div>

                {/* Acuerdo */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Acuerdo de Convivencia</h3>
                  <div className="rounded-xl border-2 p-4 mb-3 space-y-2" style={{ borderColor: '#0a2744', background: '#f8faff' }}>
                    <p className="text-xs font-bold text-center" style={{ color: '#0a2744' }}>DESDE ORUGA NOS COMPROMETEMOS CONTIGO A:</p>
                    <div className="bg-white rounded-lg p-3 text-xs text-gray-600 border border-gray-100">
                      Brindarte un espacio de trabajo cómodo, seguro y profesional donde puedas desarrollar tu actividad con todas las comodidades necesarias.
                    </div>
                    <p className="text-xs font-bold text-center" style={{ color: '#0a2744' }}>Y TAMBIÉN, ESPERAMOS DE TU PARTE:</p>
                    {ACUERDO.map((item, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 text-xs text-gray-600 border border-gray-100 flex gap-2">
                        <span style={{ color: '#0a2744' }} className="shrink-0">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer ${form.acuerdo_convivencia ? 'bg-green-50' : 'bg-gray-50'}`}
                    style={{ borderColor: form.acuerdo_convivencia ? '#0B8043' : '#e5e7eb' }}>
                    <input type="checkbox" checked={form.acuerdo_convivencia}
                      onChange={e => set('acuerdo_convivencia', e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-green-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      Me comprometo a cumplir el acuerdo de convivencia de Oruga Coworking.
                    </span>
                  </label>
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

                <div className="flex gap-3">
                  <button onClick={() => { setError(''); setStep(2) }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-600">
                    ← Volver
                  </button>
                  <button onClick={handleSubmit}
                    disabled={loading || !form.acuerdo_convivencia}
                    className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                    style={{ background: '#0B8043', color: '#fff' }}>
                    {loading ? 'Registrando...' : '✓ Completar registro'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: '#c5e84a' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold underline">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
