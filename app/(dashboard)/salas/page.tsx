'use client'

import Image from 'next/image'
import Link from 'next/link'

const salas = [
  {
    nombre: 'Alocasia',
    tipo: 'Sala Privada',
    capacidad: '1 – 3 personas',
    descripcion: 'Sala íntima con molduras originales y luz natural. Ideal para reuniones pequeñas, entrevistas y trabajo concentrado. Muy utilizada por estudios jurídicos.',
    foto: '/salas/alocasia-real-1.jpg',
    fotoExtra: '/salas/alocasia-real-2.jpg',
    color: '#E67C73',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Aire acondicionado', 'Luz natural', 'Café incluido'],
  },
  {
    nombre: 'Begonia',
    tipo: 'Sala Privada',
    capacidad: '3 – 5 personas',
    descripcion: 'La sala más demandada de Oruga. Perfecta para equipos chicos y reuniones de trabajo diarias.',
    foto: '/salas/begonia-real-1.jpg',
    fotoExtra: '/salas/begonia-real-2.jpg',
    color: '#0B8043',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Aire acondicionado', 'Luz natural', 'Café incluido'],
  },
  {
    nombre: 'Pothus 2',
    tipo: 'Sala Privada',
    capacidad: '3 – 5 personas',
    descripcion: 'Sala privada en planta baja, cómoda y con buena iluminación para sesiones de trabajo productivas.',
    foto: '/salas/pothus2-real-1.png',
    fotoExtra: '/salas/pothus2-real-2.png',
    color: '#33B679',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Aire acondicionado', 'Planta baja', 'Café incluido'],
  },
  {
    nombre: 'Pandurata',
    tipo: 'Espacio Compartido',
    capacidad: 'Hasta 4 personas',
    descripcion: 'Espacio abierto con escritorios fijos. Ideal para freelancers y profesionales que buscan un ambiente colaborativo.',
    foto: '/salas/pandurata-real-1.png',
    color: '#7986CB',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Escritorio fijo', 'Ambiente colaborativo', 'Café incluido'],
  },
  {
    nombre: 'Peperomia',
    tipo: 'Sala Privada Mediana',
    capacidad: '6 – 8 personas',
    descripcion: 'Sala amplia para equipos medianos. Equipada para reuniones, presentaciones y trabajo en equipo.',
    foto: '/salas/peperomia-real-1.jpg',
    fotoExtra: '/salas/peperomia-real-2.jpg',
    color: '#F6BF26',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Aire acondicionado', 'Proyector disponible', 'Café incluido'],
  },
  {
    nombre: 'Calathea',
    tipo: 'Sala Privada Grande',
    capacidad: '10 – 12 personas',
    descripcion: 'La sala grande de planta alta. Perfecta para equipos numerosos, capacitaciones y reuniones corporativas.',
    foto: '/salas/calathea-real-1.jpg',
    fotoExtra: '/salas/calathea-real-2.jpg',
    color: '#3F51B5',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Planta alta', 'Capacidad corporativa', 'Café incluido'],
  },
  {
    nombre: 'Pothus',
    tipo: 'Sala de Eventos',
    capacidad: 'Hasta 20 personas',
    descripcion: 'Espacio versátil para talleres, capacitaciones y workshops. Totalmente configurable según tu necesidad.',
    foto: '/salas/pothus-real-1.jpg',
    fotoExtra: '/salas/pothus-real-2.jpg',
    color: '#F4511E',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Configurable', 'Ideal para talleres', 'Café incluido'],
  },
  {
    nombre: 'Bromelia',
    tipo: 'Sala de Eventos Grande',
    capacidad: 'Hasta 30 personas',
    descripcion: 'El espacio más grande de Oruga. Ideal para charlas, presentaciones y eventos. Se puede unir con Pothus para 50 personas.',
    foto: '/salas/bromelia-real-1.jpg',
    fotoExtra: '/salas/bromelia-real-2.jpg',
    color: '#039BE5',
    disponible: true,
    amenities: ['WiFi alta velocidad', 'Escenario disponible', 'Hasta 50 personas (con Pothus)', 'Coffee break opcional'],
  },
]

const espaciosComunes = [
  { nombre: 'Cafetería', desc: 'Café, infusiones y snacks disponibles todo el día.', foto: '/salas/cafeteria-real.jpg', emoji: '☕' },
  { nombre: 'Patio', desc: 'Espacio al aire libre para descansar y conectar.', foto: '/salas/patio-real.jpg', emoji: '🌿' },
  { nombre: 'Escalera y hall', desc: 'Arquitectura histórica con ambientes únicos en Corrientes.', foto: '/salas/escalera-real.jpg', emoji: '🏛️' },
]

export default function SalasPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72"
        style={{ background: '#0a2744' }}>
        <Image src="/salas/oruga-126.jpg" alt="Oruga Cowork" fill className="object-cover opacity-40" />
        <div className="relative z-10 flex flex-col justify-center h-full px-8">
          <p className="text-sm font-medium mb-1" style={{ color: '#c5e84a' }}>Buenos Aires 678 · Corrientes Capital</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Nuestros espacios</h1>
          <p className="text-blue-200 mt-2 max-w-xl">El primer coworking de Corrientes. Salas privadas, espacios compartidos y salones de eventos para cada necesidad.</p>
        </div>
      </div>

      {/* Salas privadas */}
      <section>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#0a2744' }}>Salas privadas y compartidas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {salas.map(sala => (
            <div key={sala.nombre} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative bg-gray-100" style={{ height: (sala as any).fotoExtra ? 'auto' : '11rem' }}>
                {(sala as any).fotoExtra ? (
                  <div className="grid grid-cols-2 gap-0.5 h-44">
                    <div className="relative"><Image src={sala.foto} alt={sala.nombre} fill className="object-cover" /></div>
                    <div className="relative"><Image src={(sala as any).fotoExtra} alt={sala.nombre} fill className="object-cover" /></div>
                  </div>
                ) : (
                  <div className="relative h-44"><Image src={sala.foto} alt={sala.nombre} fill className="object-cover" /></div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                    style={{ background: sala.color }}>
                    {sala.tipo}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sala.disponible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {sala.disponible ? '● Disponible' : '● Ocupada'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{sala.nombre}</h3>
                  <span className="text-xs text-gray-400">👥 {sala.capacidad}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{sala.descripcion}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {sala.amenities.map(a => (
                    <span key={a} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">{a}</span>
                  ))}
                </div>
                <a
                  href={`https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20consultar%20disponibilidad%20para%20la%20sala%20${encodeURIComponent(sala.nombre)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 text-white"
                  style={{ background: '#0a2744' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Consultar {sala.nombre}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Espacios comunes */}
      <section>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#0a2744' }}>Espacios comunes</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {espaciosComunes.map(e => (
            <div key={e.nombre} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative h-36 bg-gray-100">
                <Image src={e.foto} alt={e.nombre} fill className="object-cover" />
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900">{e.emoji} {e.nombre}</p>
                <p className="text-sm text-gray-500 mt-1">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: '#0a2744' }}>
        <div>
          <p className="text-white font-bold text-lg">¿Listo para reservar?</p>
          <p className="text-blue-200 text-sm mt-1">Escribinos y te confirmamos disponibilidad al instante.</p>
        </div>
        <div className="flex gap-3">
          <a href="https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20reservar%20una%20sala"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#25D366', color: '#fff' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <Link href="/calendar"
            className="flex items-center px-5 py-3 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors">
            Ver disponibilidad
          </Link>
        </div>
      </div>
    </div>
  )
}
