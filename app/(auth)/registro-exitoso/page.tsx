import Link from 'next/link'
import Image from 'next/image'

export default function RegistroExitosoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a2744 0%, #1a3f6f 100%)' }}>
      <div className="max-w-md w-full text-center">
        <div className="relative w-40 h-16 mx-auto mb-6">
          <Image src="/logo/logo-oruga-sin-fondo.png" alt="Oruga Cowork" fill className="object-contain brightness-0 invert" />
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#0a2744' }}>¡Registro exitoso!</h1>
          <p className="text-gray-500 text-sm mb-2">Tu cuenta fue creada correctamente.</p>
          <p className="text-gray-500 text-sm mb-6">
            El equipo de Oruga revisará tu registro y te habilitará el acceso. Te avisamos por WhatsApp cuando esté listo. 🚀
          </p>
          <a href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Me%20acabo%20de%20registrar%20en%20la%20plataforma"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white mb-3"
            style={{ background: '#25D366' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Avisarnos por WhatsApp
          </a>
          <Link href="/login" className="block text-sm font-medium hover:underline" style={{ color: '#0a2744' }}>
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
