'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const BENEFICIOS = [
  '1 hora gratuita por semana en sala Alocasia (primera reserva semanal)',
  'Descuentos exclusivos en otras salas del espacio',
  'Precio sin IVA en todas tus reservas',
  'Pago en efectivo o transferencia bancaria',
]

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
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]) }}
      />
    </div>
  )
}

export default function RegisterAbogadosPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acuerdo, setAcuerdo] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    matricula: '',
    telefono: '',
    email: '',
    password: '',
    dni_cuil: '',
  })
  const [fotoDni, setFotoDni] = useState<File | null>(null)
  const [fotoMatricula, setFotoMatricula] = useState<File | null>(null)

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit() {
    if (!acuerdo) { setError('Debés aceptar los términos para continuar.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    })

    if (authError) {
      setError(authError.message === 'User already registered' ? 'Ya existe una cuenta con ese email.' : authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) { setError('Error al crear la cuenta.'); setLoading(false); return }

    // Subir fotos a Supabase Storage
    let fotoDniUrl = ''
    let fotoMatriculaUrl = ''

    if (fotoDni) {
      const ext = fotoDni.name.split('.').pop()
      const { data } = await supabase.storage.from('documentos').upload(`${userId}/dni.${ext}`, fotoDni, { upsert: true })
      if (data) {
        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(data.path)
        fotoDniUrl = urlData.publicUrl
      }
    }

    if (fotoMatricula) {
      const ext = fotoMatricula.name.split('.').pop()
      const { data } = await supabase.storage.from('documentos').upload(`${userId}/matricula.${ext}`, fotoMatricula, { upsert: true })
      if (data) {
        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(data.path)
        fotoMatriculaUrl = urlData.publicUrl
      }
    }

    await supabase.from('profiles').upsert({
      id: userId,
      full_name: form.full_name,
      email: form.email,
      telefono: form.telefono,
      pais_provincia: 'Corrientes, Argentina',
      tipo_acceso: 'Abogado - Colegio 1ª Circunscripción',
      actividad_empresa: `Abogado · Matrícula ${form.matricula || 'sin especificar'}`,
      facturacion_nombre: form.full_name,
      dni_cuil: form.dni_cuil,
      foto_dni_url: fotoDniUrl,
      foto_matricula_url: fotoMatriculaUrl,
      acuerdo_convivencia: true,
      registro_completo: true,
      role: 'abogado_colegio',
    })

    router.push('/registro-exitoso')
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #0a2744 0%, #1a3f6f 100%)' }}>
      <div className="max-w-md mx-auto">

        <div className="text-center mb-6">
          <div className="relative w-40 h-16 mx-auto mb-2">
            <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga Cowork" fill className="object-contain brightness-0 invert" />
          </div>
          <p className="text-sm" style={{ color: '#c5e84a' }}>Buenos Aires 678 · Corrientes Capital</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5" style={{ background: '#0a2744' }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚖️</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#c5e84a' }}>CONVENIO ESPECIAL</p>
                <h1 className="text-lg font-bold text-white leading-tight">Colegio de Abogados</h1>
                <p className="text-blue-200 text-xs">1ª Circunscripción · Corrientes</p>
              </div>
            </div>
          </div>

          {/* Beneficios */}
          <div className="px-6 py-4 border-b border-gray-100" style={{ background: '#f0f4ff' }}>
            <p className="text-xs font-semibold text-gray-600 mb-2">TUS BENEFICIOS EN ORUGA</p>
            <ul className="space-y-1.5">
              {BENEFICIOS.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span style={{ color: '#0a2744', fontWeight: 700 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Progress */}
          <div className="flex border-b border-gray-100">
            {['Datos personales', 'Documentos', 'Confirmar'].map((label, i) => {
              const s = i + 1
              return (
                <div key={s} className={`flex-1 py-2 text-center text-xs font-semibold transition-colors ${step === s ? 'text-white' : step > s ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
                  style={step === s ? { background: '#0a2744' } : {}}>
                  {step > s ? '✓' : label}
                </div>
              )
            })}
          </div>

          <div className="p-6 space-y-4">

            {/* PASO 1: Datos personales */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre y Apellido <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Matrícula profesional</label>
                  <input className={inputClass} value={form.matricula} onChange={e => set('matricula', e.target.value)} placeholder="Nº de matrícula (opcional)" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">DNI / CUIL <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.dni_cuil} onChange={e => set('dni_cuil', e.target.value)} placeholder="Sin guiones ni espacios" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="Ej: 3794123456 (sin 0, sin 15)" type="tel" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" type="password" />
                </div>
                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
                <button
                  onClick={() => {
                    if (!form.full_name || !form.email || !form.password || !form.telefono || !form.dni_cuil) {
                      setError('Completá todos los campos obligatorios.')
                      return
                    }
                    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
                    setError(''); setStep(2)
                  }}
                  className="w-full py-3 rounded-lg font-semibold text-sm"
                  style={{ background: '#0a2744', color: '#c5e84a' }}>
                  Continuar →
                </button>
              </>
            )}

            {/* PASO 2: Fotos de documentos */}
            {step === 2 && (
              <>
                <p className="text-xs text-gray-500">Necesitamos verificar tu identidad y membresía al Colegio. Sacá una foto clara de cada documento.</p>

                <FotoUpload
                  label="Foto del DNI (frente)"
                  sublabel="Asegurate que se lean bien el nombre y número"
                  value={fotoDni}
                  onChange={setFotoDni}
                  required
                />

                <FotoUpload
                  label="Foto de la matrícula / credencial del Colegio"
                  sublabel="Credencial o constancia de matrícula vigente"
                  value={fotoMatricula}
                  onChange={setFotoMatricula}
                  required
                />

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}

                <div className="flex gap-3">
                  <button onClick={() => { setError(''); setStep(1) }} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-600">← Volver</button>
                  <button
                    onClick={() => {
                      if (!fotoDni) { setError('Cargá la foto del DNI para continuar.'); return }
                      if (!fotoMatricula) { setError('Cargá la foto de la matrícula para continuar.'); return }
                      setError(''); setStep(3)
                    }}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm"
                    style={{ background: '#0a2744', color: '#c5e84a' }}>
                    Continuar →
                  </button>
                </div>
              </>
            )}

            {/* PASO 3: Confirmar y aceptar */}
            {step === 3 && (
              <>
                <div className="rounded-xl border border-gray-200 p-4 space-y-2 text-sm bg-gray-50">
                  <p className="font-semibold text-gray-800 mb-1">Confirmá tus datos</p>
                  <div className="flex justify-between text-gray-600"><span>Nombre</span><span className="font-medium text-gray-800">{form.full_name}</span></div>
                  <div className="flex justify-between text-gray-600"><span>DNI / CUIL</span><span className="font-medium text-gray-800">{form.dni_cuil}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Email</span><span className="font-medium text-gray-800">{form.email}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Teléfono</span><span className="font-medium text-gray-800">{form.telefono}</span></div>
                  {form.matricula && <div className="flex justify-between text-gray-600"><span>Matrícula</span><span className="font-medium text-gray-800">{form.matricula}</span></div>}
                  <div className="flex justify-between text-gray-600">
                    <span>Documentos</span>
                    <span className="text-green-600 font-medium">✓ DNI + Matrícula</span>
                  </div>
                </div>

                <div className="rounded-xl border-2 p-4" style={{ borderColor: '#0a2744', background: '#f8faff' }}>
                  <p className="text-xs font-bold mb-3" style={{ color: '#0a2744' }}>CONDICIONES DEL CONVENIO</p>
                  <ul className="space-y-2 text-xs text-gray-600 mb-4">
                    <li className="flex gap-2"><span>•</span><span>El beneficio de 1 hora gratuita por semana aplica exclusivamente en sala <strong>Alocasia</strong>.</span></li>
                    <li className="flex gap-2"><span>•</span><span>Se cobra a partir de la segunda reserva en la misma semana, siempre sin IVA.</span></li>
                    <li className="flex gap-2"><span>•</span><span>El pago se realiza en efectivo o transferencia bancaria.</span></li>
                    <li className="flex gap-2"><span>•</span><span>Las reservas están sujetas a disponibilidad. Coordiná por WhatsApp antes de venir.</span></li>
                    <li className="flex gap-2"><span>•</span><span>Respetá el acuerdo de convivencia del espacio y cuida las instalaciones.</span></li>
                  </ul>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${acuerdo ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                    <input type="checkbox" checked={acuerdo} onChange={e => setAcuerdo(e.target.checked)} className="mt-0.5 w-4 h-4 accent-green-600" />
                    <span className="text-xs font-semibold text-gray-700">Acepto las condiciones del convenio y el acuerdo de convivencia de Oruga Coworking.</span>
                  </label>
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}

                <div className="flex gap-3">
                  <button onClick={() => { setError(''); setStep(2) }} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-600">← Volver</button>
                  <button onClick={handleSubmit} disabled={loading || !acuerdo}
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
        <p className="text-center text-xs mt-3 text-blue-200">
          ¿Dudas? Escribinos al{' '}
          <a href="https://wa.me/5493794899843" target="_blank" rel="noopener noreferrer" className="underline font-medium">WhatsApp de Oruga</a>
        </p>
      </div>
    </div>
  )
}
