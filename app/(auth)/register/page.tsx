'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

function FotoUpload({
  label, sublabel, value, onChange, required
}: {
  label: string
  sublabel?: string
  value: File | null
  onChange: (f: File) => void
  required?: boolean
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
        className={`relative w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
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
            <span className="text-xs text-gray-500 font-medium">Tocá para sacar foto o subir imagen</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]) }} />
    </div>
  )
}

const ACUERDO = [
  'Fomentar el respeto entre las personas que se encuentran en el espacio, controlando el volumen de la voz sin alterar la tranquilidad de los demás coworkers.',
  'Cuidar las instalaciones y la limpieza de las salas y los espacios comunes como baños, cocina y patio, cumpliendo las normas convencionales de higiene.',
  'A la hora de almorzar o fumar, hacerlo en los espacios comunes correspondientes.',
  'Ser precavido con los objetos personales, evitando pérdidas y obstrucciones en los espacios.',
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fotoDni, setFotoDni] = useState<File | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    pais_provincia: '',
    telefono: '',
    telefono_emergencia: '',
    tipo_acceso: '',
    actividad_empresa: '',
    facturacion_nombre: '',
    dni_cuil: '',
    acuerdo_convivencia: false,
  })

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

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
      setError(authError.message === 'User already registered' ? 'Ya existe una cuenta con ese email.' : authError.message)
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
        tipo_acceso: form.tipo_acceso,
        actividad_empresa: form.actividad_empresa,
        facturacion_nombre: form.facturacion_nombre || form.full_name,
        dni_cuil: form.dni_cuil,
        foto_dni_url: fotoDniUrl,
        acuerdo_convivencia: true,
        registro_completo: true,
        role: 'user',
      })
    }

    router.push('/registro-exitoso')
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #0a2744 0%, #1a3f6f 100%)' }}>
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="relative w-40 h-16 mx-auto mb-2">
            <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga Cowork" fill className="object-contain brightness-0 invert" />
          </div>
          <p className="text-sm" style={{ color: '#c5e84a' }}>Buenos Aires 678 · Corrientes Capital</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-bold" style={{ color: '#0a2744' }}>Registro Oruga Coworking</h1>
            <p className="text-xs text-gray-500 mt-1">Esta información es confidencial. La empresa se compromete a utilizarla solo con fines de registro y base de datos.</p>
          </div>

          {/* Progress */}
          <div className="flex border-b border-gray-100">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 py-2 text-center text-xs font-semibold transition-colors ${step === s ? 'text-white' : step > s ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
                style={step === s ? { background: '#0a2744' } : {}}>
                {step > s ? '✓' : s === 1 ? 'Datos personales' : s === 2 ? 'Actividad' : 'Acuerdo'}
              </div>
            ))}
          </div>

          <div className="p-6 space-y-4">

            {/* PASO 1: Datos personales */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre y Apellido *</label>
                  <input className={inputClass} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">País / Provincia *</label>
                  <input className={inputClass} value={form.pais_provincia} onChange={e => set('pais_provincia', e.target.value)} placeholder="Ej: Corrientes, Argentina" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">N° de Teléfono *</label>
                  <input className={inputClass} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="Ej: 3794123456 (sin 0, sin 15)" type="tel" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">N° de contacto de Emergencia *</label>
                  <input className={inputClass} value={form.telefono_emergencia} onChange={e => set('telefono_emergencia', e.target.value)} placeholder="Nombre y teléfono de contacto" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                  <input className={inputClass} value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña *</label>
                  <input className={inputClass} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" type="password" />
                </div>
                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
                <button
                  onClick={() => {
                    if (!form.full_name || !form.email || !form.password || !form.telefono || !form.pais_provincia) { setError('Completá todos los campos obligatorios.'); return }
                    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
                    setError(''); setStep(2)
                  }}
                  className="w-full py-3 rounded-lg font-semibold text-sm"
                  style={{ background: '#0a2744', color: '#c5e84a' }}>
                  Continuar →
                </button>
              </>
            )}

            {/* PASO 2: Actividad y facturación */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Accedés al coworking como *</label>
                  <div className="space-y-2">
                    {['Profesional Independiente', 'Grupo o Empresa', 'Otros'].map(op => (
                      <label key={op} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.tipo_acceso === op ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="tipo" value={op} checked={form.tipo_acceso === op} onChange={() => set('tipo_acceso', op)} className="accent-blue-700" />
                        <span className="text-sm text-gray-700">{op}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Especificá tu actividad / empresa *</label>
                  <input className={inputClass} value={form.actividad_empresa} onChange={e => set('actividad_empresa', e.target.value)} placeholder="Ej: Estudio jurídico, desarrollador freelance..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Información de Facturación *</label>
                  <p className="text-xs text-gray-400 mb-1">A nombre de quien se emitirá la factura.</p>
                  <input className={inputClass} value={form.facturacion_nombre} onChange={e => set('facturacion_nombre', e.target.value)} placeholder="Nombre / Razón social" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">DNI / CUIL / CUIT * <span className="font-normal text-gray-400">(sin guiones ni espacios)</span></label>
                  <input className={inputClass} value={form.dni_cuil} onChange={e => set('dni_cuil', e.target.value)} placeholder="Ej: 20123456789" />
                </div>
                <FotoUpload
                  label="Foto del DNI (frente)"
                  sublabel="Necesitamos verificar tu identidad. Sacá una foto clara donde se lea bien el nombre y número."
                  value={fotoDni}
                  onChange={setFotoDni}
                  required
                />
                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
                <div className="flex gap-3">
                  <button onClick={() => { setError(''); setStep(1) }} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-600">← Volver</button>
                  <button
                    onClick={() => {
                      if (!form.tipo_acceso || !form.actividad_empresa || !form.dni_cuil) { setError('Completá todos los campos obligatorios.'); return }
                      if (!fotoDni) { setError('Cargá la foto del DNI para continuar.'); return }
                      setError(''); setStep(3)
                    }}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm"
                    style={{ background: '#0a2744', color: '#c5e84a' }}>
                    Continuar →
                  </button>
                </div>
              </>
            )}

            {/* PASO 3: Acuerdo de convivencia */}
            {step === 3 && (
              <>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Acuerdo de Convivencia</h3>
                  <p className="text-xs text-gray-500 mb-4">Para ser parte de Oruga Coworking revisá los términos con los que deseamos trabajar.</p>

                  <div className="rounded-xl border-2 p-4 mb-4 space-y-3" style={{ borderColor: '#0a2744', background: '#f8faff' }}>
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

                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.acuerdo_convivencia ? 'bg-green-50' : 'bg-gray-50'}`}
                    style={{ borderColor: form.acuerdo_convivencia ? '#0B8043' : '#e5e7eb' }}>
                    <input type="checkbox" checked={form.acuerdo_convivencia} onChange={e => set('acuerdo_convivencia', e.target.checked)} className="mt-0.5 w-4 h-4 accent-green-600" />
                    <span className="text-sm font-semibold text-gray-700">Me comprometo a cumplir el acuerdo de convivencia de Oruga Coworking.</span>
                  </label>
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}

                <div className="flex gap-3">
                  <button onClick={() => { setError(''); setStep(2) }} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-600">← Volver</button>
                  <button onClick={handleSubmit} disabled={loading || !form.acuerdo_convivencia}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
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
