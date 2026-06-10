'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
const router = useRouter()
const [password, setPassword] = useState('')
const [confirm, setConfirm] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [success, setSuccess] = useState(false)

useEffect(() => {
// Supabase maneja el token del hash automáticamente
}, [])

async function handleReset(e: React.FormEvent) {
e.preventDefault()
if (password !== confirm) {
setError('Las contraseñas no coinciden.')
return
}
if (password.length < 6) {
setError('La contraseña debe tener al menos 6 caracteres.')
return
}
setLoading(true)
setError('')
const supabase = createClient()
const { error } = await supabase.auth.updateUser({ password })
if (error) {
setError('No se pudo actualizar la contraseña. El link puede haber expirado.')
} else {
setSuccess(true)
setTimeout(() => router.push('/login'), 3000)
}
setLoading(false)
}

return (
<div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8fafc' }}>
<div className="w-full max-w-sm">
<div className="text-center mb-8">
<div className="relative w-40 h-12 mx-auto mb-4">
<Image
src="/logo/logo-oruga-sin-fondo.png"
alt="Oruga Cowork"
fill
className="object-contain"
style={{ filter: 'brightness(0) saturate(100%) invert(12%) sepia(50%) saturate(800%) hue-rotate(188deg)' }}
/>
</div>
<h1 className="text-2xl font-black" style={{ color: '#0a2744' }}>Nueva contraseña</h1>
<p className="text-gray-500 text-sm mt-1">Ingresá tu nueva contraseña para continuar.</p>
</div>

{success ? (
<div className="rounded-2xl bg-green-50 border border-green-200 px-6 py-8 text-center">
<div className="text-4xl mb-3">✅</div>
<p className="text-green-700 font-bold text-lg">¡Contraseña actualizada!</p>
<p className="text-green-600 text-sm mt-1">Redirigiendo al login...</p>
</div>
) : (
<form onSubmit={handleReset} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
<div>
<label className="block text-sm font-semibold text-gray-700 mb-1.5">Nueva contraseña</label>
<input
type="password"
value={password}
onChange={e => setPassword(e.target.value)}
required
minLength={6}
placeholder="Mínimo 6 caracteres"
className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white shadow-sm text-sm"
/>
</div>
<div>
<label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar contraseña</label>
<input
type="password"
value={confirm}
onChange={e => setConfirm(e.target.value)}
required
placeholder="Repetí la contraseña"
className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-gray-900 bg-white shadow-sm text-sm"
/>
</div>
{error && (
<div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-600 text-sm">
{error}
</div>
)}
<button
type="submit"
disabled={loading}
className="w-full font-bold py-3 rounded-xl text-sm disabled:opacity-60 transition-all"
style={{ background: '#c5e84a', color: '#0a2744' }}
>
{loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
</button>
</form>
)}

<p className="text-center text-xs text-gray-400 mt-6">
<a href="/login" className="hover:underline" style={{ color: '#0a2744' }}>← Volver al login</a>
</p>
</div>
</div>
)
}
