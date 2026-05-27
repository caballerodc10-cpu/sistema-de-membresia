'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Membership } from '@/types'

type PrecioFila = [number, number] // [horas, precio]

type SalaPrivada = {
  nombre: string
  tipo: string
  capacidad: string
  color: string
  precios: PrecioFila[]
  membresias: PrecioFila[]
}

const SALAS: SalaPrivada[] = [
  {
    nombre: 'Alocasia',
    tipo: 'Sala Privada',
    capacidad: '1 – 3 personas',
    color: '#E67C73',
    precios: [[2,13000],[3,19300],[4,25400],[5,31400],[6,37400],[7,43100],[8,48700],[9,54300]],
    membresias: [[10,60200],[20,110100],[40,209000]],
  },
  {
    nombre: 'Begonia',
    tipo: 'Sala Privada',
    capacidad: '3 – 5 personas',
    color: '#0B8043',
    precios: [[2,19500],[3,28800],[4,38200],[5,47300],[6,56200],[7,64800],[8,73600],[9,82000]],
    membresias: [[10,90200],[20,168300],[40,319000]],
  },
  {
    nombre: 'Pothus 2',
    tipo: 'Sala Privada',
    capacidad: '3 – 5 personas',
    color: '#33B679',
    precios: [[2,19500],[3,28800],[4,38200],[5,47300],[6,56200],[7,64800],[8,73600],[9,82000]],
    membresias: [[10,90200],[20,168300],[40,319000]],
  },
  {
    nombre: 'Peperomia',
    tipo: 'Sala Privada',
    capacidad: '6 – 8 personas',
    color: '#F6BF26',
    precios: [[2,24300],[3,36400],[4,47600],[5,59000],[6,70200],[7,81100],[8,91700],[9,102300]],
    membresias: [[10,112600],[20,209000],[40,395600]],
  },
  {
    nombre: 'Calathea',
    tipo: 'Sala Privada Grande',
    capacidad: '10 – 12 personas',
    color: '#3F51B5',
    precios: [[2,36500],[3,54200],[4,71700],[5,88800],[6,105700],[7,122100],[8,138200],[9,154300]],
    membresias: [[10,170500],[20,316800],[40,593300]],
  },
]

const FLEX_MEMBRESIAS: PrecioFila[] = [[10,27500],[20,48400],[40,94200],[60,137400],[80,170100],[100,198000]]

const EVENTOS = [
  {
    nombre: 'Pothus',
    tipo: 'Sala de Reuniones',
    capacidad: '15 – 20 personas',
    color: '#F4511E',
    precioHora: 28900,
    precios: [[2,55300],[3,82100],[4,108600],[5,134200],[6,159600],[7,184600],[8,208900],[9,233100]] as PrecioFila[],
    membresias: [[10,256500],[20,462000],[30,693000],[40,866300]] as PrecioFila[],
  },
  {
    nombre: 'Bromelia',
    tipo: 'Sala de Eventos',
    capacidad: '20 – 30 personas',
    color: '#039BE5',
    precioHora: 40300,
    precios: [[2,76700],[3,114000],[4,150500],[5,186500],[6,221700],[7,256300],[8,290300],[9,323500]] as PrecioFila[],
    membresias: [[10,356400],[20,623700],[30,935600],[40,1039500]] as PrecioFila[],
  },
  {
    nombre: 'SUM',
    tipo: 'Bromelia + Pothus',
    capacidad: '30 – 50 personas',
    color: '#8E24AA',
    precioHora: 60500,
    precios: [[2,115100],[3,171000],[4,225800],[5,279800],[6,332600],[7,384500],[8,435500],[9,485300]] as PrecioFila[],
    membresias: [[10,534600],[20,935600],[30,1403400],[40,1559300]] as PrecioFila[],
  },
]

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

function waLink(sala: string) {
  return `https://wa.me/5493794899843?text=Hola%20Oruga!%20Quiero%20consultar%20precios%20para%20la%20sala%20${encodeURIComponent(sala)}`
}

function PreciosGrid({ precios }: { precios: PrecioFila[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
      {precios.map(([hs, precio]) => (
        <div key={hs} className="flex justify-between py-0.5 border-b border-gray-50">
          <span className="text-gray-500">{hs} horas</span>
          <span className="font-semibold text-gray-800">{fmt(precio)}</span>
        </div>
      ))}
    </div>
  )
}

function SalaCard({ sala }: { sala: SalaPrivada }) {
  const [tab, setTab] = useState<'hora' | 'membresia'>('hora')
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: sala.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{sala.nombre}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{sala.tipo} · {sala.capacidad}</p>
          </div>
          <span className="text-xs text-gray-400 mt-1">2hs mín.</span>
        </div>

        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setTab('hora')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${tab === 'hora' ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
            style={tab === 'hora' ? { background: sala.color } : {}}
          >
            Por hora
          </button>
          <button
            onClick={() => setTab('membresia')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${tab === 'membresia' ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
            style={tab === 'membresia' ? { background: sala.color } : {}}
          >
            Membresía
          </button>
        </div>

        {tab === 'hora' ? (
          <PreciosGrid precios={sala.precios} />
        ) : (
          <div className="space-y-1">
            {sala.membresias.map(([hs, precio]) => (
              <div key={hs} className="flex justify-between py-0.5 border-b border-gray-50 text-sm">
                <span className="text-gray-500">{hs} horas / mes</span>
                <span className="font-semibold text-gray-800">{fmt(precio)}</span>
              </div>
            ))}
            <div className="flex justify-between py-0.5 text-sm">
              <span className="text-gray-500">Part-Time</span>
              <span className="font-semibold text-gray-400 italic">consultar</span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">Precios + IVA · vigentes 01/05/26</p>

        <a
          href={waLink(sala.nombre)}
          target="_blank" rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#0a2744' }}
        >
          Consultar {sala.nombre}
        </a>
      </div>
    </div>
  )
}

export default function MembershipPage() {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const [flexTab, setFlexTab] = useState<'hora' | 'membresia'>('hora')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('memberships').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1).single()
      setMembership(data)
      setLoading(false)
    }
    load()
  }, [])

  const hoursPercent = membership && membership.hours_total > 0
    ? Math.min(100, Math.round((membership.hours_used / membership.hours_total) * 100))
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#0a2744' }}>Membresía</h1>
        <p className="text-sm text-gray-500">Tarifas vigentes desde el 01/05/26 · Todos los precios + IVA</p>
      </div>

      {/* Estado actual */}
      {loading ? (
        <div className="h-24 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : membership ? (
        <div className="bg-white rounded-2xl border-2 p-5 shadow-sm" style={{ borderColor: '#c5e84a' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Tu membresía actual</p>
              <h2 className="text-xl font-bold" style={{ color: '#0a2744' }}>{membership.plan}</h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#c5e84a', color: '#0a2744' }}>
              ● Activa
            </span>
          </div>
          {membership.hours_total > 0 && (
            <div>
              <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                <span>Horas usadas</span>
                <span className="font-medium">{membership.hours_used} / {membership.hours_total} hs</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${hoursPercent >= 90 ? 'bg-red-400' : hoursPercent >= 70 ? 'bg-amber-400' : 'bg-green-500'}`}
                  style={{ width: `${hoursPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Restan {membership.hours_total - membership.hours_used} horas</p>
            </div>
          )}
          {membership.valid_until && (
            <p className="text-xs text-gray-400 mt-2">Válida hasta: {new Date(membership.valid_until).toLocaleDateString('es-AR')}</p>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          No tenés una membresía activa. Consultanos para armar tu plan.
        </div>
      )}

      {/* Salas Privadas */}
      <section>
        <h2 className="text-base font-bold mb-3" style={{ color: '#0a2744' }}>Salas privadas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SALAS.map(sala => <SalaCard key={sala.nombre} sala={sala} />)}
        </div>
      </section>

      {/* Espacios Flexibles */}
      <section>
        <h2 className="text-base font-bold mb-3" style={{ color: '#0a2744' }}>Espacios flexibles</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-md">
          <div className="h-1.5 w-full" style={{ background: '#7986CB' }} />
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">Pandurata</h3>
                <p className="text-xs text-gray-400 mt-0.5">Sala Compartida · Por persona</p>
              </div>
            </div>

            <div className="flex gap-1 mb-3">
              {(['hora', 'membresia'] as const).map(t => (
                <button key={t}
                  onClick={() => setFlexTab(t)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${flexTab === t ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                  style={flexTab === t ? { background: '#7986CB' } : {}}
                >
                  {t === 'hora' ? 'Por jornada' : 'Membresía'}
                </button>
              ))}
            </div>

            {flexTab === 'hora' ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between py-0.5 border-b border-gray-50">
                  <span className="text-gray-500">Jornada Parcial (5hs)</span>
                  <span className="font-semibold text-gray-800">$14.500</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-500">Jornada Completa (9hs)</span>
                  <span className="font-semibold text-gray-800">$25.000</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                {FLEX_MEMBRESIAS.map(([hs, precio]) => (
                  <div key={hs} className="flex justify-between py-0.5 border-b border-gray-50">
                    <span className="text-gray-500">{hs} horas / mes</span>
                    <span className="font-semibold text-gray-800">{fmt(precio)}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">Precios + IVA · vigentes 01/05/26</p>
            <a href={waLink('Pandurata')} target="_blank" rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90"
              style={{ background: '#0a2744' }}>
              Consultar Flex
            </a>
          </div>
        </div>
      </section>

      {/* Salones de Eventos */}
      <section>
        <h2 className="text-base font-bold mb-1" style={{ color: '#0a2744' }}>Salones de eventos</h2>
        <p className="text-xs text-gray-400 mb-3">Precios + IVA · 2hs mínima de reserva · Para más opciones consultanos</p>

        <div className="grid sm:grid-cols-3 gap-4">
          {EVENTOS.map(ev => (
            <div key={ev.nombre} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: ev.color }} />
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{ev.nombre}</h3>
                <p className="text-xs text-gray-400 mb-1">{ev.tipo}</p>
                <p className="text-xs font-medium mb-3" style={{ color: ev.color }}>👥 {ev.capacidad}</p>

                {ev.nombre === 'SUM' ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">Los precios varían según</p>
                    <p className="text-sm text-gray-500">duración y configuración.</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#0a2744' }}>Consultanos por WhatsApp</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between py-0.5 border-b border-gray-50">
                      <span className="text-gray-500">2 horas</span>
                      <span className="font-semibold text-gray-800">{fmt(ev.precios[0][1])}</span>
                    </div>
                    <div className="flex justify-between py-1 text-gray-400 italic text-xs">
                      <span>3 a 9 horas</span>
                      <span>consultar</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-xs text-gray-400 italic">
                      <span>Membresías mensuales</span>
                      <span>consultar</span>
                    </div>
                  </div>
                )}

                <a href={waLink(ev.nombre)} target="_blank" rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90"
                  style={{ background: '#0a2744' }}>
                  Consultar
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
