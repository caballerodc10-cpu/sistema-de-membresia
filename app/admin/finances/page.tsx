'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────
type CajaRow = {
  id: number
  mes: string
  fecha: string
  tipo_comp: string
  n_comprob: string
  coworker: string
  forma_pago: string
  medio_pago: string
  precio_neto: number | null
  iva: number | null
  ingreso: number | null
  pendientes: number | null
  pagos_nuestros: number | null
  descuentos: number | null
  ingresado: number | null
  gastos: number | null
  sala: string
  concepto: string
  observaciones: string
}
type FormData = Omit<CajaRow, 'id'>

// ─── Constants ────────────────────────────────────────────────────────────────
const MESES_LABELS: Record<string, string> = {
  '2026-01': 'Enero', '2026-02': 'Febrero', '2026-03': 'Marzo',
  '2026-04': 'Abril', '2026-05': 'Mayo', '2026-06': 'Junio',
  '2026-07': 'Julio', '2026-08': 'Agosto', '2026-09': 'Septiembre',
  '2026-10': 'Octubre', '2026-11': 'Noviembre', '2026-12': 'Diciembre',
}
const SALAS = [
  'Alocasia','Begonia','Pothus 2','Pandurata','Peperomia',
  'Calathea','Pothus','Bromelia','Güembé','N/C','Lockers',
  'Pothus reuniones','Membresia sala',
]
const CONCEPTOS = [
  'Reserva de sala','Membresia sala','Seña reserva sala','Cancelación pago',
  'Gastos varios','Pago de servicios','Retiro de efectivo','Honorarios',
  'Capsulas','Maquina de cafe','Impresiones','Monotributo',
  'Comisiones','Movimiento entre cuentas',
]
const TIPOS_COMP = ['Recibo','Fact A','Fact B','interno','Proveedor','sin factura']
const FORMAS_PAGO = ['Efectivo','Transferencia','Otros','Tarjeta de crédito/débito']
const MEDIOS_PAGO = ['Contado','Banco Patagonia','Mercado pago','Link de pagos']

const TIPO_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  'Fact B':       { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400' },
  'Fact A':       { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
  'Recibo':       { bg: 'bg-emerald-50',text: 'text-emerald-600',dot: 'bg-emerald-400' },
  'Proveedor':    { bg: 'bg-rose-50',   text: 'text-rose-600',   dot: 'bg-rose-400' },
  'interno':      { bg: 'bg-slate-100', text: 'text-slate-500',  dot: 'bg-slate-400' },
  'sin factura':  { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400' },
}

const emptyForm = (): FormData => ({
  mes: '', fecha: new Date().toISOString().split('T')[0],
  tipo_comp: '', n_comprob: '', coworker: '',
  forma_pago: 'Efectivo', medio_pago: 'Contado',
  precio_neto: null, iva: null, ingreso: null, pendientes: null,
  pagos_nuestros: null, descuentos: null, ingresado: null, gastos: null,
  sala: '', concepto: '', observaciones: '',
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const compact = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : Math.abs(n) >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`

const fmtARS = (n: number | null) => {
  if (n === null || n === undefined) return '—'
  if (n === 0) return '$0'
  const abs = Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return n < 0 ? `-$${abs}` : `$${abs}`
}

const fmtDate = (d: string) => {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const getMesLabel = (d: string) => {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function numField(v: string): number | null {
  if (!v.trim()) return null
  const n = parseFloat(v.replace(',', '.').replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? null : n
}

// ─── Mini SVG icons (no dep) ──────────────────────────────────────────────────
const Icon = {
  ArrowUp: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2}>
      <path d="M8 12V4M4 8l4-4 4 4"/>
    </svg>
  ),
  ArrowDown: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2}>
      <path d="M8 4v8M4 8l4 4 4-4"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <path d="M8 3v10M3 8h10"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <path d="M8 3v7M5 8l3 3 3-3M3 13h10"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <circle cx="7" cy="7" r="4"/><path d="M11 11l2 2"/>
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <path d="M2 4h12M5 8h6M7 12h2"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
      <path d="M3 3l10 10M13 3L3 13"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <path d="M10 4L6 8l4 4"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <path d="M6 4l4 4-4 4"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.8}>
      <path d="M11 2l3 3-8 8H3v-3L11 2z"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4"/>
    </svg>
  ),
  BarChart2: () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <rect x="1" y="8" width="4" height="6" rx="0.5"/><rect x="6" y="4" width="4" height="10" rx="0.5"/><rect x="11" y="1" width="4" height="13" rx="0.5"/>
    </svg>
  ),
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  label, value, sub, accent, icon, trend,
}: {
  label: string; value: number; sub?: string
  accent: 'green' | 'blue' | 'red' | 'orange' | 'amber'
  icon: string; trend?: number
}) {
  const cfg = {
    green:  { val: 'text-emerald-600', bg: 'bg-emerald-50',  ring: 'ring-emerald-100' },
    blue:   { val: 'text-blue-600',    bg: 'bg-blue-50',     ring: 'ring-blue-100' },
    red:    { val: 'text-rose-500',    bg: 'bg-rose-50',     ring: 'ring-rose-100' },
    orange: { val: 'text-orange-500',  bg: 'bg-orange-50',   ring: 'ring-orange-100' },
    amber:  { val: 'text-amber-600',   bg: 'bg-amber-50',    ring: 'ring-amber-100' },
  }[accent]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className={`text-xl ${cfg.bg} ${cfg.ring} ring-1 w-9 h-9 rounded-xl flex items-center justify-center`}>
          {icon}
        </span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
            {trend >= 0 ? <Icon.ArrowUp /> : <Icon.ArrowDown />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${cfg.val}`}>
          {compact(value)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wide">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────
function TypeBadge({ tipo }: { tipo: string }) {
  const s = TIPO_BADGE[tipo] || { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {tipo || '—'}
    </span>
  )
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">{compact(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FinancesPage() {
  const [rows, setRows]               = useState<CajaRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [tableError, setTableError]   = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState<FormData>(emptyForm())
  const [saving, setSaving]           = useState(false)
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [search, setSearch]           = useState('')
  const [filterTipo, setFilterTipo]   = useState<string>('')
  const [page, setPage]               = useState(1)
  const [showCharts, setShowCharts]   = useState(true)
  const PAGE_SIZE = 25

  useEffect(() => { loadData() }, [filterMonth])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const startDate = `${filterMonth}-01`
    const [year, month] = filterMonth.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${filterMonth}-${lastDay}`

    const { data, error } = await supabase
      .from('caja').select('*')
      .gte('fecha', startDate).lte('fecha', endDate)
      .order('fecha', { ascending: true }).order('id', { ascending: true })

    if (error?.code === '42P01') setTableError(true)
    else setTableError(false)
    setRows(data || [])
    setLoading(false)
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const totalIngreso     = rows.reduce((s, r) => s + (r.ingreso || 0), 0)
  const totalGastos      = rows.reduce((s, r) => s + Math.abs(r.gastos || 0), 0)
  const totalPagoNuestro = rows.reduce((s, r) => s + Math.abs(r.pagos_nuestros || 0), 0)
  const totalIngresado   = rows.reduce((s, r) => s + (r.ingresado || 0), 0)
  const totalPendientes  = rows.reduce((s, r) => s + (r.pendientes || 0), 0)
  const balance          = totalIngreso - totalGastos - totalPagoNuestro

  // Charts data
  const distribTipo = useMemo(() => {
    const map: Record<string, number> = {}
    rows.forEach(r => {
      if (r.ingreso && r.ingreso > 0) {
        map[r.tipo_comp || 'sin tipo'] = (map[r.tipo_comp || 'sin tipo'] || 0) + r.ingreso
      }
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [rows])

  const distribMedio = useMemo(() => {
    const map: Record<string, number> = {}
    rows.forEach(r => {
      if (r.ingreso && r.ingreso > 0) {
        map[r.medio_pago || 'Otro'] = (map[r.medio_pago || 'Otro'] || 0) + r.ingreso
      }
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [rows])

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

  // Filtered + paginated
  const rowsFiltrados = useMemo(() => rows.filter(r => {
    const matchSearch = !search.trim() ||
      r.coworker?.toLowerCase().includes(search.toLowerCase()) ||
      r.concepto?.toLowerCase().includes(search.toLowerCase()) ||
      r.tipo_comp?.toLowerCase().includes(search.toLowerCase()) ||
      r.sala?.toLowerCase().includes(search.toLowerCase()) ||
      r.observaciones?.toLowerCase().includes(search.toLowerCase())
    const matchTipo = !filterTipo || r.tipo_comp === filterTipo
    return matchSearch && matchTipo
  }), [rows, search, filterTipo])

  const totalPages  = Math.max(1, Math.ceil(rowsFiltrados.length / PAGE_SIZE))
  const rowsPagina  = rowsFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function setField(k: keyof FormData, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const payload = { ...form, mes: form.mes || getMesLabel(form.fecha) }
    if (editingId !== null) {
      const { error } = await supabase.from('caja').update(payload).eq('id', editingId)
      if (error) alert('Error: ' + error.message)
      else { setShowForm(false); setEditingId(null); setForm(emptyForm()); loadData() }
    } else {
      const { error } = await supabase.from('caja').insert(payload)
      if (error) alert('Error: ' + error.message)
      else { setShowForm(false); setForm(emptyForm()); loadData() }
    }
    setSaving(false)
  }

  function handleEditStart(r: CajaRow) {
    const { id, ...rest } = r
    setEditingId(id); setForm(rest as FormData); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este registro?')) return
    await createClient().from('caja').delete().eq('id', id)
    loadData()
  }

  // ── Exports ────────────────────────────────────────────────────────────────
  function exportarCSV() {
    const headers = ['MES','FECHA','TIPO COMP','N° COMP','COWORKER','F.PAGO','MEDIO','PRECIO NETO','IVA','INGRESO','PENDIENTES','PAGOS NUESTROS','DESCUENTOS','INGRESADO','GASTOS','SALA','CONCEPTO','OBSERVACIONES']
    const csvRows = rows.map(r => [
      r.mes||'', r.fecha ? fmtDate(r.fecha) : '', r.tipo_comp||'', r.n_comprob||'', r.coworker||'',
      r.forma_pago||'', r.medio_pago||'',
      r.precio_neto ?? '', r.iva ?? '', r.ingreso ?? '', r.pendientes ?? '',
      r.pagos_nuestros ?? '', r.descuentos ?? '', r.ingresado ?? '', r.gastos ?? '',
      r.sala||'', r.concepto||'', r.observaciones||'',
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(';'))
    const csv = [headers.join(';'), ...csvRows].join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `Oruga-Caja-${filterMonth}.csv` })
    a.click()
  }

  function exportarXLSX() {
    const wb = XLSX.utils.book_new()
    const headers = ['MES','FECHA','TIPO COMP','N° COMP','COWORKER','F.PAGO','MEDIO','PRECIO NETO','IVA','INGRESO','PENDIENTES','PAGOS NUESTROS','DESCUENTOS','INGRESADO','GASTOS','SALA','CONCEPTO','OBSERVACIONES']
    const data = rows.map(r => [
      r.mes||'', r.fecha||'', r.tipo_comp||'', r.n_comprob||'', r.coworker||'',
      r.forma_pago||'', r.medio_pago||'',
      r.precio_neto||0, r.iva||0, r.ingreso||0, r.pendientes||0,
      r.pagos_nuestros||0, r.descuentos||0, r.ingresado||0, r.gastos||0,
      r.sala||'', r.concepto||'', r.observaciones||'',
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    ws['!cols'] = headers.map(() => ({ wch: 16 }))
    XLSX.utils.book_append_sheet(wb, ws, `Caja ${filterMonth}`)
    const resumen = [
      ['RESUMEN', filterMonth], [''],
      ['Ingresos', totalIngreso], ['Gastos', -totalGastos],
      ['Pagos nuestros', -totalPagoNuestro], ['Ingresado', totalIngresado],
      ['Pendientes', totalPendientes], [''], ['BALANCE', balance],
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(resumen)
    ws2['!cols'] = [{ wch: 28 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumen')
    XLSX.writeFile(wb, `Oruga-Caja-${filterMonth}.xlsx`)
  }

  // ── Input helpers ─────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300'
  const selectCls = inputCls
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Planilla de Caja</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {MESES_LABELS[filterMonth] || filterMonth} · {rows.length} movimientos
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Month selector */}
            <input type="month" value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            <button onClick={() => setShowCharts(s => !s)}
              className={`h-9 px-3 flex items-center gap-1.5 rounded-lg text-sm font-medium border transition-colors ${showCharts ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Icon.BarChart2 />
              <span className="hidden sm:inline">Gráficos</span>
            </button>
            <button onClick={exportarCSV}
              className="h-9 px-3 flex items-center gap-1.5 bg-white text-slate-600 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Icon.Download />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={exportarXLSX}
              className="h-9 px-3 flex items-center gap-1.5 bg-white text-slate-600 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Icon.Download />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => { setShowForm(s => !s); setForm(emptyForm()); setEditingId(null) }}
              className="h-9 px-4 flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">
              <Icon.Plus />
              Agregar
            </button>
          </div>
        </div>

        {/* ── Table error ──────────────────────────────────────────────── */}
        {tableError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="font-semibold text-amber-800 mb-1">⚠️ Tabla `caja` no encontrada</p>
            <p className="text-sm text-amber-700 mb-3">Creala desde el SQL Editor de Supabase.</p>
            <a href="https://supabase.com/dashboard/project/jxvmxhesyujthvtyyzmi/sql/new"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 text-white text-sm font-semibold rounded-lg hover:bg-amber-800">
              Abrir SQL Editor →
            </a>
          </div>
        )}

        {/* ── KPI Cards ────────────────────────────────────────────────── */}
        {!tableError && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard label="Ingresos"        value={totalIngreso}     accent="green"  icon="↑" />
            <KPICard label="Ingresado"        value={totalIngresado}   accent="blue"   icon="🏦" />
            <KPICard label="Gastos / Egresos" value={-totalGastos}     accent="red"    icon="↓" />
            <KPICard label="Pagos nuestros"   value={-totalPagoNuestro}accent="orange" icon="💳" />
            <KPICard label="Pendientes"       value={totalPendientes}  accent="amber"  icon="⏳" />
          </div>
        )}

        {/* ── Balance banner ───────────────────────────────────────────── */}
        {!tableError && !loading && (
          <div className={`rounded-2xl px-5 py-3.5 flex items-center justify-between ${balance >= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                Balance del mes
              </p>
              <p className={`text-2xl font-bold tracking-tight mt-0.5 ${balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {fmtARS(balance)}
              </p>
            </div>
            <div className="text-3xl opacity-50">{balance >= 0 ? '✓' : '!'}</div>
          </div>
        )}

        {/* ── Charts ───────────────────────────────────────────────────── */}
        {showCharts && !tableError && !loading && rows.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Ingresos vs Gastos bar */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-4">Flujo de caja</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { name: 'Ingresos',   value: totalIngreso,      fill: '#10b981' },
                  { name: 'Ingresado',  value: totalIngresado,    fill: '#3b82f6' },
                  { name: 'Gastos',     value: totalGastos,       fill: '#f43f5e' },
                  { name: 'Pago N.',    value: totalPagoNuestro,  fill: '#f97316' },
                  { name: 'Pendientes', value: totalPendientes,   fill: '#f59e0b' },
                ]} barSize={36} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => compact(v).replace('$', '')} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {[
                      { fill: '#10b981' }, { fill: '#3b82f6' },
                      { fill: '#f43f5e' }, { fill: '#f97316' }, { fill: '#f59e0b' },
                    ].map((c, i) => <Cell key={i} fill={c.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución por medio de pago */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-4">Medio de pago</p>
              {distribMedio.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={distribMedio} cx="50%" cy="50%" innerRadius={38} outerRadius={58} isAnimationActive={false}
                        dataKey="value" stroke="none">
                        {distribMedio.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {distribMedio.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-slate-500">{d.name}</span>
                        </div>
                        <span className="font-semibold text-slate-700">{compact(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-300 text-sm">Sin datos</div>
              )}
            </div>
          </div>
        )}

        {/* ── Add / Edit Form ───────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  {editingId ? 'Editar movimiento' : 'Nuevo movimiento'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Completá los campos y guardá</p>
              </div>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <Icon.X />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Row 1 */}
              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" required value={form.fecha}
                  onChange={e => setField('fecha', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tipo comp.</label>
                <select value={form.tipo_comp} onChange={e => setField('tipo_comp', e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {TIPOS_COMP.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>N° Comprobante</label>
                <input type="text" value={form.n_comprob}
                  onChange={e => setField('n_comprob', e.target.value)}
                  placeholder="ej: 182" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Coworker / Empresa *</label>
                <input type="text" required value={form.coworker}
                  onChange={e => setField('coworker', e.target.value)}
                  placeholder="Nombre" className={inputCls} />
              </div>
              {/* Row 2 */}
              <div>
                <label className={labelCls}>Forma de pago</label>
                <select value={form.forma_pago} onChange={e => setField('forma_pago', e.target.value)} className={selectCls}>
                  {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Medio de pago</label>
                <select value={form.medio_pago} onChange={e => setField('medio_pago', e.target.value)} className={selectCls}>
                  {MEDIOS_PAGO.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Ingreso ($)</label>
                <input type="number" step="0.01" value={form.ingreso ?? ''}
                  onChange={e => setField('ingreso', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Precio neto (sin IVA)</label>
                <input type="number" step="0.01" value={form.precio_neto ?? ''}
                  onChange={e => setField('precio_neto', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              {/* Row 3 */}
              <div>
                <label className={labelCls}>IVA</label>
                <input type="number" step="0.01" value={form.iva ?? ''}
                  onChange={e => setField('iva', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ingresado en caja/cta</label>
                <input type="number" step="0.01" value={form.ingresado ?? ''}
                  onChange={e => setField('ingresado', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Gastos / Egresos</label>
                <input type="number" step="0.01" value={form.gastos ?? ''}
                  onChange={e => setField('gastos', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Pendientes</label>
                <input type="number" step="0.01" value={form.pendientes ?? ''}
                  onChange={e => setField('pendientes', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              {/* Row 4 */}
              <div>
                <label className={labelCls}>Pagos nuestros</label>
                <input type="number" step="0.01" value={form.pagos_nuestros ?? ''}
                  onChange={e => setField('pagos_nuestros', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descuentos / Comisiones</label>
                <input type="number" step="0.01" value={form.descuentos ?? ''}
                  onChange={e => setField('descuentos', numField(e.target.value))}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sala / Servicio</label>
                <select value={form.sala} onChange={e => setField('sala', e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {SALAS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Concepto *</label>
                <select value={form.concepto} onChange={e => setField('concepto', e.target.value)} required className={selectCls}>
                  <option value="">Seleccionar...</option>
                  {CONCEPTOS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Observaciones full width */}
              <div className="col-span-2 sm:col-span-4">
                <label className={labelCls}>Observaciones</label>
                <input type="text" value={form.observaciones}
                  onChange={e => setField('observaciones', e.target.value)}
                  placeholder="Notas adicionales" className={inputCls} />
              </div>
              {/* Actions */}
              <div className="col-span-2 sm:col-span-4 flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Table Section ─────────────────────────────────────────────── */}
        {!tableError && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">

            {/* Table toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon.Search />
                </span>
                <input
                  type="text"
                  placeholder="Buscar coworker, concepto..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="w-full pl-9 pr-3 h-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-300"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <Icon.X />
                  </button>
                )}
              </div>

              {/* Tipo filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['', ...TIPOS_COMP].map(t => (
                  <button key={t} onClick={() => { setFilterTipo(t); setPage(1) }}
                    className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors ${filterTipo === t
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {t || 'Todos'}
                  </button>
                ))}
              </div>

              <div className="ml-auto text-xs text-slate-400">
                {rowsFiltrados.length} resultado{rowsFiltrados.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                  Cargando...
                </div>
              </div>
            ) : rowsPagina.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">Sin resultados para esta búsqueda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Fecha','Tipo','Coworker / Empresa','Medio','Ingreso','Ingresado','Gastos','Pendientes','Sala','Concepto',''].map(h => (
                        <th key={h} className="text-left px-3 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rowsPagina.map(r => {
                      const isNeg = (r.gastos ?? 0) < 0 || (r.pagos_nuestros ?? 0) < 0
                      return (
                        <tr key={r.id}
                          className={`group transition-colors hover:bg-slate-50/80 ${isNeg ? 'bg-rose-50/30' : ''}`}>
                          <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                            {fmtDate(r.fecha)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <TypeBadge tipo={r.tipo_comp} />
                          </td>
                          <td className="px-3 py-2.5 max-w-[200px]">
                            <p className="font-medium text-slate-800 truncate">{r.coworker || '—'}</p>
                            {r.n_comprob && <p className="text-[10px] text-slate-400">#{r.n_comprob}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.medio_pago || '—'}</td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            {r.ingreso ? (
                              <span className="font-semibold text-emerald-600">{fmtARS(r.ingreso)}</span>
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            {r.ingresado ? (
                              <span className="font-medium text-blue-600">{fmtARS(r.ingresado)}</span>
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            {r.gastos ? (
                              <span className="font-medium text-rose-500">{fmtARS(r.gastos)}</span>
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            {r.pendientes ? (
                              <span className="font-medium text-amber-600">{fmtARS(r.pendientes)}</span>
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.sala || '—'}</td>
                          <td className="px-3 py-2.5 text-slate-600 max-w-[140px]">
                            <p className="truncate" title={r.concepto}>{r.concepto || '—'}</p>
                            {r.observaciones && (
                              <p className="text-[10px] text-slate-400 truncate" title={r.observaciones}>{r.observaciones}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditStart(r)}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                <Icon.Edit />
                              </button>
                              <button onClick={() => handleDelete(r.id)}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                <Icon.Trash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Totals footer */}
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td colSpan={4} className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Totales del mes
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-700 text-xs">{fmtARS(totalIngreso)}</td>
                      <td className="px-3 py-3 text-right font-bold text-blue-700 text-xs">{fmtARS(totalIngresado)}</td>
                      <td className="px-3 py-3 text-right font-bold text-rose-600 text-xs">{fmtARS(-totalGastos)}</td>
                      <td className="px-3 py-3 text-right font-bold text-amber-700 text-xs">{fmtARS(totalPendientes)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Página {page} de {totalPages} · {rowsFiltrados.length} registros
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1}
                    className="h-7 px-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                    «
                  </button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="h-7 w-7 flex items-center justify-center hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors text-slate-500">
                    <Icon.ChevronLeft />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    const p = start + i
                    return p <= totalPages ? (
                      <button key={p} onClick={() => setPage(p)}
                        className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                        {p}
                      </button>
                    ) : null
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="h-7 w-7 flex items-center justify-center hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors text-slate-500">
                    <Icon.ChevronRight />
                  </button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                    className="h-7 px-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors">
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
