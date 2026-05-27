import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

const NAVY = '#0a2744'
const GREEN = '#1a9e5c'
const ORANGE = '#f59e0b'
const LIGHT_GRAY = '#f8f9fa'
const MID_GRAY = '#6b7280'
const DARK_GRAY = '#374151'
const WHITE = '#ffffff'
const RED = '#dc2626'
const BLUE = '#2563eb'

const DESKTOP = path.join('C:', 'Users', 'Alan', 'Desktop')

// ─── Helpers ───────────────────────────────────────────────────────────────

function docBase() {
  return new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } })
}

function header(doc, title, subtitle) {
  // Fondo azul
  doc.rect(0, 0, doc.page.width, 90).fill(NAVY)
  // Logo / nombre
  doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold')
     .text('oruga', 50, 22)
  doc.fontSize(9).fillColor('#93c5fd').font('Helvetica')
     .text('COWORKING', 50, 46)
  // Título
  doc.fontSize(16).fillColor(WHITE).font('Helvetica-Bold')
     .text(title, 0, 28, { align: 'right', width: doc.page.width - 50 })
  if (subtitle) {
    doc.fontSize(9).fillColor('#93c5fd').font('Helvetica')
       .text(subtitle, 0, 50, { align: 'right', width: doc.page.width - 50 })
  }
  doc.y = 110
  doc.fillColor(DARK_GRAY)
}

function sectionTitle(doc, text, color = NAVY) {
  doc.moveDown(0.5)
  doc.rect(50, doc.y, doc.page.width - 100, 26).fill(color)
  doc.fontSize(12).fillColor(WHITE).font('Helvetica-Bold')
     .text(text, 60, doc.y - 20)
  doc.moveDown(0.6)
  doc.fillColor(DARK_GRAY)
}

function step(doc, num, title, desc) {
  const y = doc.y
  // Círculo numerado
  doc.circle(68, y + 8, 12).fill(GREEN)
  doc.fontSize(10).fillColor(WHITE).font('Helvetica-Bold')
     .text(String(num), 64, y + 2)
  // Título del paso
  doc.fontSize(11).fillColor(NAVY).font('Helvetica-Bold')
     .text(title, 88, y)
  // Descripción
  doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica')
     .text(desc, 88, doc.y + 2, { width: doc.page.width - 138 })
  doc.moveDown(0.5)
}

function infoBox(doc, icon, label, value, color = BLUE) {
  const y = doc.y
  doc.roundedRect(50, y, doc.page.width - 100, 30, 6).fill('#eff6ff')
  doc.fontSize(11).fillColor(color).font('Helvetica-Bold')
     .text(icon + ' ' + label + ':', 60, y + 9)
  doc.fontSize(10).fillColor(DARK_GRAY).font('Helvetica')
     .text(value, 60 + (label.length * 7.5) + 20, y + 10)
  doc.y = y + 38
}

function calBox(doc, hora, sala, cliente, tipo = 'reserva') {
  const colors = {
    membresia: { bg: '#f0fdf4', border: '#16a34a', badge: GREEN, text: 'MEMBRESÍA' },
    reserva: { bg: '#eff6ff', border: '#2563eb', badge: BLUE, text: 'RESERVA' },
    abogados: { bg: '#faf5ff', border: '#7c3aed', badge: '#7c3aed', text: 'COLEGIO ABO.' },
  }
  const c = colors[tipo] || colors.reserva
  const y = doc.y
  doc.roundedRect(50, y, doc.page.width - 100, 28, 4).fill(c.bg)
  doc.rect(50, y, 4, 28).fill(c.border)
  // Hora
  doc.fontSize(8.5).fillColor(MID_GRAY).font('Helvetica-Bold')
     .text(hora, 62, y + 5)
  // Sala
  doc.fontSize(9).fillColor(NAVY).font('Helvetica-Bold')
     .text(sala, 62, y + 15)
  // Cliente
  doc.fontSize(9).fillColor(DARK_GRAY).font('Helvetica')
     .text(cliente, 62 + 85, y + 10)
  // Badge
  doc.roundedRect(doc.page.width - 125, y + 6, 65, 16, 3).fill(c.badge)
  doc.fontSize(7).fillColor(WHITE).font('Helvetica-Bold')
     .text(c.text, doc.page.width - 125, y + 10, { width: 65, align: 'center' })
  doc.y = y + 34
}

function tip(doc, text) {
  const y = doc.y
  doc.roundedRect(50, y, doc.page.width - 100, 26, 5).fill('#fefce8')
  doc.fontSize(9).fillColor('#92400e').font('Helvetica')
     .text('💡 ' + text, 60, y + 8, { width: doc.page.width - 120 })
  doc.y = y + 33
}

function pageFooter(doc, pageNum, total) {
  doc.fontSize(8).fillColor(MID_GRAY).font('Helvetica')
  doc.text(
    `Oruga Coworking · Buenos Aires 678, Corrientes Capital · orugacoworking@gmail.com  ·  Pág. ${pageNum}/${total}`,
    50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 }
  )
}

// ─── PDF 1: GUÍA DEL CLIENTE ────────────────────────────────────────────────

function crearGuiaCliente() {
  const doc = docBase()
  const out = path.join(DESKTOP, 'Oruga-Guia-Cliente.pdf')
  doc.pipe(fs.createWriteStream(out))

  // ── Página 1: Portada
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY)
  doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(GREEN)

  doc.fontSize(42).fillColor(WHITE).font('Helvetica-Bold')
     .text('oruga', 50, 120)
  doc.fontSize(16).fillColor('#93c5fd').font('Helvetica')
     .text('COWORKING', 50, 170)

  doc.moveDown(2)
  doc.rect(50, 215, 3, 130).fill(GREEN)
  doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold')
     .text('Guía del Usuario', 62, 220)
  doc.fontSize(15).fillColor('#bfdbfe').font('Helvetica')
     .text('Registro · Disponibilidad · Reservas', 62, 258)

  doc.fontSize(10).fillColor('#93c5fd').font('Helvetica')
     .text('Todo lo que necesitás saber para usar\nel sistema de reservas de Oruga.', 62, 298)

  // Datos de contacto
  doc.roundedRect(50, 500, doc.page.width - 100, 100, 8).fill('#0d3363')
  doc.fontSize(11).fillColor(WHITE).font('Helvetica-Bold')
     .text('📍 Buenos Aires 678, Corrientes Capital', 70, 518)
  doc.fontSize(10).fillColor('#93c5fd').font('Helvetica')
     .text('📱 WhatsApp: +54 9 379 489-9843', 70, 538)
     .text('✉  orugacoworking@gmail.com', 70, 554)
     .text('🌐 Sistema de reservas en línea', 70, 570)

  doc.fontSize(8).fillColor('#475569')
     .text(`Documento generado: ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, doc.page.height - 55, { align: 'center', width: doc.page.width - 100 })

  doc.addPage()

  // ── Página 2: Registro
  header(doc, 'REGISTRO DE CUENTA', 'Paso a paso')

  doc.fontSize(10).fillColor(MID_GRAY).font('Helvetica')
     .text('Creá tu cuenta en el sistema para acceder a la disponibilidad de salas y gestionar tus reservas.', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.8)

  sectionTitle(doc, '  CÓMO REGISTRARSE')

  step(doc, 1, 'Accedé al sistema',
    'Ingresá desde cualquier dispositivo a la URL del sistema de Oruga. Hacé clic en "Registrarse" o "Crear cuenta".')

  step(doc, 2, 'Completá tus datos personales',
    'Nombre completo · Email · Teléfono · DNI/CUIL · País y provincia.')

  step(doc, 3, 'Datos de actividad',
    'Indicá tu tipo de acceso (individual, empresa, abogado del Colegio), actividad o empresa, y nombre para facturación.')

  step(doc, 4, 'Subí tu foto de DNI',
    'Fotografiá el frente de tu DNI o matrícula profesional. Es obligatorio para completar el registro.')

  step(doc, 5, 'Aceptá el acuerdo de convivencia',
    'Leé y aceptá las normas del espacio. Este paso es necesario para activar tu cuenta.')

  step(doc, 6, '¡Listo!',
    'Tu cuenta queda registrada. El equipo de Oruga la revisará y te confirma el acceso en breve.')

  doc.moveDown(0.3)
  sectionTitle(doc, '  TIPOS DE CUENTA', GREEN)

  const tipos = [
    ['👤 Usuario general', 'Acceso al calendario de disponibilidad y solicitud de reservas por WhatsApp o email.'],
    ['🏢 Empresa / Miembro', 'Membresía mensual de horas. Acceso directo a reservas según paquete contratado.'],
    ['⚖️ Abogado – Colegio', 'Registro especial con matrícula profesional. Beneficio de 1 hora gratuita mensual por sala privada.'],
  ]
  for (const [t, d] of tipos) {
    const y = doc.y
    doc.roundedRect(50, y, doc.page.width - 100, 36, 6).fill(LIGHT_GRAY)
    doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold').text(t, 62, y + 6)
    doc.fontSize(9).fillColor(MID_GRAY).font('Helvetica').text(d, 62, y + 20, { width: doc.page.width - 122 })
    doc.y = y + 43
  }

  doc.moveDown(0.3)
  tip(doc, 'Si sos parte del Colegio de Abogados, registrate en la sección especial "Abogados Colegio" para acceder a las tarifas bonificadas.')

  pageFooter(doc, 2, 5)
  doc.addPage()

  // ── Página 3: Disponibilidad y cómo reservar
  header(doc, 'VER DISPONIBILIDAD', 'Calendario en tiempo real')

  doc.fontSize(10).fillColor(MID_GRAY).font('Helvetica')
     .text('Una vez registrado, podés ver los horarios disponibles en el calendario interactivo.', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.8)

  sectionTitle(doc, '  EL CALENDARIO DE DISPONIBILIDAD')

  doc.fontSize(10).fillColor(DARK_GRAY).font('Helvetica')
     .text('El calendario muestra en tiempo real qué salas están ocupadas y en qué horarios. Cada color representa una sala diferente:', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.5)

  const salas = [
    ['Alocasia', '#E67C73'], ['Begonia', '#0B8043'], ['Pothus 2', '#33B679'],
    ['Pandurata', '#7986CB'], ['Peperomia', '#F6BF26'], ['Calathea', '#3F51B5'],
    ['Pothus', '#F4511E'], ['Bromelia', '#039BE5'],
  ]
  let x = 50
  const startY = doc.y
  salas.forEach(([nombre, color], i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const bx = 50 + col * 125
    const by = startY + row * 26
    doc.roundedRect(bx, by, 115, 20, 4).fill(color)
    const textColor = ['#F6BF26', '#E67C73'].includes(color) ? '#000000' : WHITE
    doc.fontSize(8.5).fillColor(textColor).font('Helvetica-Bold')
       .text(nombre, bx + 6, by + 5, { width: 103, align: 'center' })
  })
  doc.y = startY + 60

  doc.moveDown(0.4)
  doc.fontSize(10).fillColor(MID_GRAY).font('Helvetica')
     .text('Los espacios en blanco = sala disponible ese horario.', 50, doc.y)
  doc.moveDown(0.8)

  sectionTitle(doc, '  VISTAS DEL CALENDARIO')
  const vistas = [
    ['Semana', 'Vista por defecto. Muestra todos los horarios de lun-dom en columnas por día.'],
    ['Día', 'Detalle de un día específico. Útil para ver disponibilidad hora por hora.'],
    ['Mes', 'Vista general. Ideal para planificar reservas con anticipación.'],
  ]
  for (const [v, d] of vistas) {
    const y = doc.y
    doc.roundedRect(50, y, 80, 34, 5).fill(NAVY)
    doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold').text(v, 50, y + 12, { width: 80, align: 'center' })
    doc.fontSize(9).fillColor(DARK_GRAY).font('Helvetica').text(d, 140, y + 10, { width: doc.page.width - 190 })
    doc.y = y + 42
  }

  doc.moveDown(0.3)
  sectionTitle(doc, '  CÓMO HACER UNA RESERVA', ORANGE)

  step(doc, 1, 'Revisá el calendario',
    'Identificá el día y horario que necesitás y verificá que la sala esté disponible (espacio en blanco).')

  step(doc, 2, 'Contactá por WhatsApp o email',
    '📱 +54 9 379 489-9843  ·  ✉ orugacoworking@gmail.com\nIndicá sala, fecha, horario y cantidad de personas.')

  step(doc, 3, 'Confirmación y seña',
    'El equipo te envía el presupuesto. Se requiere el 50% de seña para confirmar la reserva.')

  step(doc, 4, 'Tu reserva aparece en el calendario',
    'Una vez confirmada, tu reserva queda registrada en el calendario con tu nombre y horario.')

  step(doc, 5, 'El día de la reserva',
    'Llegá 10 minutos antes. Firmá la planilla de asistencia al retirarte.')

  tip(doc, 'Cancelaciones con menos de 24 hs de anticipación se descuentan de las horas disponibles de membresía.')

  pageFooter(doc, 3, 5)
  doc.addPage()

  // ── Página 4: Ejemplo real Mayo 2026
  header(doc, 'CASO REAL – MAYO 2026', 'Reservas reales del calendario')

  doc.fontSize(10).fillColor(MID_GRAY).font('Helvetica')
     .text('Así se ve el calendario de Oruga en un día real. Ejemplo: jueves 4 de mayo de 2026.', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.6)

  sectionTitle(doc, '  JUEVES 4 DE MAYO 2026 – OCUPACIÓN DEL DÍA')

  calBox(doc, '07:15 – 08:15', 'CALATHEA', 'Distribuidora AWA', 'membresia')
  calBox(doc, '08:00 – 12:00', 'BROMELIA', 'Fernando Piñeyro – Anatomía (30 personas)', 'membresia')
  calBox(doc, '09:00 – 18:00', 'PANDURATA', 'Débora – Espacio full-time', 'membresia')
  calBox(doc, '10:00 – 13:00', 'POTHUS 2', 'Camba Cua', 'membresia')
  calBox(doc, '14:00 – 16:00', 'BEGONIA', 'Nadia Cheme', 'membresia')
  calBox(doc, '14:00 – 18:00', 'BROMELIA', 'Fernando Piñeyro – tarde', 'membresia')
  calBox(doc, '15:00 – 16:00', 'ALOCASIA', 'Dario – Colegio de Abogados', 'abogados')
  calBox(doc, '15:00 – 18:00', 'POTHUS', 'PSA – Equipo Maie', 'membresia')
  calBox(doc, '15:00 – 18:00', 'PEPEROMIA', 'Virginia Munaretto', 'reserva')
  calBox(doc, '16:30 – 17:30', 'POTHUS 2', 'Margarita Sánchez Goitia', 'reserva')
  calBox(doc, '16:30 – 17:30', 'ALOCASIA', 'Abo. Mario Longoni', 'abogados')
  calBox(doc, '18:00 – 20:00', 'BEGONIA', 'Club de Robótica', 'membresia')
  calBox(doc, '18:00 – 19:00', 'ALOCASIA', 'Abo. Fabrizio Quimey', 'abogados')
  calBox(doc, '19:00 – 20:00', 'CALATHEA', 'CeIATE (membresía 20hs)', 'membresia')
  calBox(doc, '19:00 – 20:00', 'ALOCASIA', 'Abo. Juana Capara', 'abogados')

  doc.moveDown(0.3)
  // Leyenda
  const leyenda = [['MEMBRESÍA', GREEN], ['RESERVA PUNTUAL', BLUE], ['COLEGIO ABOGADOS', '#7c3aed']]
  let lx = 50
  for (const [label, color] of leyenda) {
    doc.roundedRect(lx, doc.y, 130, 16, 3).fill(color)
    doc.fontSize(7.5).fillColor(WHITE).font('Helvetica-Bold')
       .text(label, lx, doc.y + 4, { width: 130, align: 'center' })
    lx += 138
  }
  doc.y += 23

  pageFooter(doc, 4, 5)
  doc.addPage()

  // ── Página 5: Miembros frecuentes y FAQ
  header(doc, 'MEMBRESÍAS Y PREGUNTAS', 'Beneficios para miembros frecuentes')

  sectionTitle(doc, '  MEMBRESÍAS MENSUALES')
  doc.fontSize(10).fillColor(DARK_GRAY).font('Helvetica')
     .text('Al adquirir una membresía mensual de horas, obtenés un paquete de horas disponibles para usar en la sala elegida durante el mes. El sistema lleva el control de horas restantes automáticamente.', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.8)

  const miembros = [
    ['Fernando Piñeyro – Anatomía', 'Bromelia', '40 hs/semana', 'Miembro frecuente – Bonificación 15%'],
    ['CeIATE', 'Calathea', '20 hs/mes', 'L-V de 19 a 20hs – $285.000+IVA'],
    ['Camba Cua', 'Pothus 2', '30 hs/mes', 'Miembro frecuente'],
    ['Club de Robótica', 'Begonia + Pothus', '16+6 hs/mes', 'L/J (Begonia) y V (Pothus) de 18 a 20hs'],
    ['Distribuidora AWA', 'Calathea', '24 hs/mes', 'Membresía mensual – lun-vie 7 a 8hs'],
    ['PSA – Equipo Maie', 'Pothus', '21 hs/mes', 'Membresía recurrente L-V tarde'],
  ]

  for (const [cliente, sala, horas, detalle] of miembros) {
    const y = doc.y
    doc.roundedRect(50, y, doc.page.width - 100, 38, 5).fill(LIGHT_GRAY)
    doc.rect(50, y, 4, 38).fill(GREEN)
    doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold').text(cliente, 64, y + 5)
    doc.fontSize(8.5).fillColor(MID_GRAY).font('Helvetica')
       .text(`📍 ${sala}  ·  ⏱ ${horas}`, 64, y + 19)
    doc.fontSize(8.5).fillColor(MID_GRAY).text(detalle, 64, y + 29)
    doc.y = y + 45
  }

  doc.moveDown(0.3)
  sectionTitle(doc, '  PREGUNTAS FRECUENTES', NAVY)

  const faqs = [
    ['¿Puedo cancelar una reserva?', 'Sí, con al menos 24 hs de anticipación sin costo. Cancelaciones con menos tiempo descuentan las horas del mes.'],
    ['¿Cuántas personas entran en cada sala?', 'Alocasia: 4 · Begonia: 10 · Pothus 2: 6 · Calathea: 12 · Pothus: 20 · Bromelia: 30 · Pandurata: 8 · Peperomia: 8.'],
    ['¿Cuándo se habilita el acceso?', 'Podés ingresar hasta 10 minutos antes del horario de inicio de la reserva.'],
    ['¿Qué incluye la sala?', 'WiFi, proyector (en salas grandes), pizarrón. Café disponible en máquina (consumo aparte).'],
    ['¿Cómo abono la reserva?', 'Efectivo, transferencia bancaria, o Mercado Pago. Se requiere 50% de seña al confirmar.'],
  ]
  for (const [q, a] of faqs) {
    const y = doc.y
    doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold').text('❓ ' + q, 50, y)
    doc.fontSize(9).fillColor(DARK_GRAY).font('Helvetica').text(a, 50, doc.y + 2, { width: doc.page.width - 100 })
    doc.moveDown(0.6)
  }

  // CTA final
  doc.moveDown(0.3)
  doc.roundedRect(50, doc.y, doc.page.width - 100, 55, 8).fill(NAVY)
  doc.fontSize(13).fillColor(WHITE).font('Helvetica-Bold')
     .text('¿Querés reservar?', 0, doc.y + 10, { align: 'center', width: doc.page.width })
  doc.fontSize(10).fillColor('#93c5fd').font('Helvetica')
     .text('📱 WhatsApp: +54 9 379 489-9843   ·   ✉ orugacoworking@gmail.com', 0, doc.y + 8, { align: 'center', width: doc.page.width })

  pageFooter(doc, 5, 5)
  doc.end()
  console.log('✅ Guía del cliente guardada en el Escritorio')
  return out
}

// ─── PDF 2: MANUAL DEL PANEL ADMINISTRATIVO ─────────────────────────────────

function crearManualAdmin() {
  const doc = docBase()
  const out = path.join(DESKTOP, 'Oruga-Manual-Admin.pdf')
  doc.pipe(fs.createWriteStream(out))

  // ── Portada
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a')
  doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(ORANGE)

  doc.fontSize(42).fillColor(WHITE).font('Helvetica-Bold').text('oruga', 50, 120)
  doc.fontSize(16).fillColor('#94a3b8').font('Helvetica').text('COWORKING – SISTEMA DE GESTIÓN', 50, 170)
  doc.rect(50, 210, 3, 120).fill(ORANGE)
  doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold').text('Manual del', 62, 215)
  doc.fontSize(28).fillColor(ORANGE).font('Helvetica-Bold').text('Panel Administrativo', 62, 250)
  doc.fontSize(12).fillColor('#94a3b8').font('Helvetica').text('Gestión completa de reservas · usuarios · finanzas · membresías', 62, 290)

  doc.roundedRect(50, 470, doc.page.width - 100, 120, 8).fill('#1e293b')
  doc.fontSize(11).fillColor(WHITE).font('Helvetica-Bold').text('Secciones del panel:', 70, 488)
  const secs = ['📅 Calendario de Reservas', '👥 Usuarios Registrados', '💰 Planilla de Caja', '⭐ Membresías']
  secs.forEach((s, i) => {
    doc.fontSize(10).fillColor('#94a3b8').font('Helvetica').text(s, 70 + (i % 2) * 230, 508 + Math.floor(i / 2) * 22)
  })

  doc.fontSize(8).fillColor('#475569').text(
    `Versión ${new Date().toLocaleDateString('es-AR')} · Uso interno – Oruga Coworking`,
    50, doc.page.height - 55, { align: 'center', width: doc.page.width - 100 }
  )

  doc.addPage()

  // ── Página 2: Acceso al panel y calendario
  header(doc, 'CALENDARIO DE RESERVAS', 'Vista y gestión de bookings')

  doc.fontSize(10).fillColor(MID_GRAY).font('Helvetica')
     .text('El calendario es el corazón del sistema. Desde acá podés ver todas las reservas, crearlas, editarlas y marcar pagos.', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.7)

  sectionTitle(doc, '  ACCESO AL PANEL ADMIN')
  step(doc, 1, 'Iniciar sesión', 'Ingresá con tu email y contraseña de administrador. El sistema detecta automáticamente el rol admin.')
  step(doc, 2, 'Panel Admin en el menú', 'Aparece el menú ampliado: Panel Admin · Membresías · Consumos · Finanzas · Salas · Usuarios.')
  step(doc, 3, 'Vista completa del calendario', 'El admin ve nombre del cliente, sala, horario y estado de pago (✅) en cada evento.')

  sectionTitle(doc, '  CREAR UNA NUEVA RESERVA', GREEN)
  step(doc, 1, 'Clic en "+ Nueva reserva"', 'Botón en la esquina superior derecha del calendario.')
  step(doc, 2, 'Completar el formulario', 'Elegí sala · fecha/hora · nombre del cliente · precio total · monto de seña · medio de pago · notas.')
  step(doc, 3, 'Guardar', 'La reserva aparece inmediatamente en el calendario con el color de la sala.')

  sectionTitle(doc, '  ESTADOS DE LAS RESERVAS')
  const estados = [
    ['Confirmada', '#0B8043', 'Reserva activa. Se muestra con el color de la sala.'],
    ['Pendiente 🕐', '#F9A825', 'Reserva sin confirmar / seña pendiente.'],
    ['No vino / Cancelada', '#D50000', 'Cancelada o cliente no se presentó.'],
    ['✅ Pago completo', GREEN, 'Monto pagado ≥ precio total. Aparece el tilde verde en el evento.'],
  ]
  for (const [est, color, desc] of estados) {
    const y = doc.y
    doc.roundedRect(50, y, 130, 22, 4).fill(color)
    doc.fontSize(8.5).fillColor(WHITE).font('Helvetica-Bold').text(est, 50, y + 6, { width: 130, align: 'center' })
    doc.fontSize(9).fillColor(DARK_GRAY).font('Helvetica').text(desc, 190, y + 6)
    doc.y = y + 30
  }

  sectionTitle(doc, '  PANEL DIARIO – AGENDA DEL DÍA')
  doc.fontSize(10).fillColor(DARK_GRAY).font('Helvetica')
     .text('A la derecha del calendario aparece la agenda del día seleccionado con todas las reservas ordenadas por horario. Al hacer clic en cualquier reserva, se abre el panel de detalle donde podés:', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.3)
  const acciones = ['Cambiar el estado (confirmar / cancelar / pendiente)', 'Registrar el monto pagado y el medio de pago', 'Agregar notas internas', 'Ver todos los detalles de la reserva']
  for (const a of acciones) {
    doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica').text('  ✓  ' + a, 60, doc.y, { width: doc.page.width - 110 })
    doc.moveDown(0.3)
  }

  pageFooter(doc, 2, 5)
  doc.addPage()

  // ── Página 3: Finanzas / Planilla de Caja
  header(doc, 'PLANILLA DE CAJA', 'Registro y exportación de movimientos')

  doc.fontSize(10).fillColor(MID_GRAY).font('Helvetica')
     .text('La planilla de caja replica exactamente el formato de la planilla Excel que ya usaban. Todos los movimientos de ingresos y egresos se registran acá.', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.7)

  sectionTitle(doc, '  ACCESO Y FILTROS')
  step(doc, 1, 'Ir a Finanzas en el menú admin', 'Hacé clic en "Finanzas" en la barra de navegación superior.')
  step(doc, 2, 'Seleccionar el mes', 'El selector de mes filtra todos los registros del período elegido.')
  step(doc, 3, 'Ver totales automáticos', 'En la parte superior aparecen los totales: Ingresos · Ingresado caja · Gastos · Pagos nuestros · Pendientes.')

  sectionTitle(doc, '  COLUMNAS DE LA PLANILLA', DARK_GRAY)
  const cols = [
    ['Fecha', 'Fecha del movimiento'],
    ['Tipo Comp.', 'Recibo / Fact A / Fact B / interno / Proveedor'],
    ['N° Comprobante', 'Número del comprobante de pago'],
    ['Coworker / Empresa', 'Nombre del cliente, empresa o proveedor'],
    ['Forma / Medio de Pago', 'Efectivo, Transferencia, Otros / Contado, Banco Patagonia, Mercado Pago'],
    ['Precio Neto (sin IVA)', 'Valor neto de la operación'],
    ['IVA', 'Monto de IVA correspondiente'],
    ['Ingreso', 'Monto total ingresado (con IVA)'],
    ['Pendientes', 'Saldo pendiente de cobro'],
    ['Pagos Nuestros', 'Egresos / pagos que hace Oruga'],
    ['Descuentos', 'Comisiones de MP, descuentos aplicados'],
    ['Ingresado en caja/cta', 'Monto efectivamente ingresado en caja o banco'],
    ['Gastos / Egresos', 'Gastos varios, proveedores, servicios'],
    ['Sala / Concepto', 'Qué sala o servicio corresponde el movimiento'],
  ]
  const colY = doc.y
  cols.forEach(([col, desc], i) => {
    const row = Math.floor(i / 2)
    const colNum = i % 2
    const bx = 50 + colNum * 255
    const by = colY + row * 20
    doc.roundedRect(bx, by, 245, 18, 3).fill(i % 2 === 0 ? LIGHT_GRAY : '#e5e7eb')
    doc.fontSize(8).fillColor(NAVY).font('Helvetica-Bold').text(col + ':', bx + 6, by + 4)
    doc.fontSize(7.5).fillColor(MID_GRAY).font('Helvetica').text(desc, bx + 6 + col.length * 5.5, by + 5)
  })
  doc.y = colY + Math.ceil(cols.length / 2) * 20 + 10

  sectionTitle(doc, '  AGREGAR UN REGISTRO')
  step(doc, 1, 'Clic en "+ Agregar fila"', 'Abre el formulario de carga de nuevo movimiento.')
  step(doc, 2, 'Completar los campos', 'Al menos: fecha, coworker/proveedor y concepto. Los montos son opcionales según el tipo de movimiento.')
  step(doc, 3, 'Guardar', 'El registro aparece en la tabla del mes correspondiente.')

  sectionTitle(doc, '  EXPORTACIÓN', GREEN)
  const exportTypes = [
    ['📥 CSV', 'Mismo formato separado por punto y coma que la planilla original. Abre directo en Excel con encoding correcto.'],
    ['📊 Excel (.xlsx)', 'Planilla completa + hoja de resumen con totales del mes. Listo para presentaciones.'],
  ]
  for (const [tipo, desc] of exportTypes) {
    const y = doc.y
    doc.roundedRect(50, y, doc.page.width - 100, 28, 6).fill(LIGHT_GRAY)
    doc.fontSize(11).fillColor(NAVY).font('Helvetica-Bold').text(tipo, 60, y + 7)
    doc.fontSize(9).fillColor(DARK_GRAY).font('Helvetica').text(desc, 130, y + 9, { width: doc.page.width - 180 })
    doc.y = y + 35
  }

  pageFooter(doc, 3, 5)
  doc.addPage()

  // ── Página 4: Usuarios y Membresías
  header(doc, 'USUARIOS Y MEMBRESÍAS', 'Gestión de clientes')

  sectionTitle(doc, '  PÁGINA DE USUARIOS (/admin/users)')

  doc.fontSize(10).fillColor(DARK_GRAY).font('Helvetica')
     .text('Listado completo de todos los registrados. Podés filtrar por rol y ver la ficha completa de cada usuario.', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.5)

  const userFeatures = [
    ['Ver ficha completa', 'Nombre, email, DNI, teléfono, actividad, fotos de documentos, estado del acuerdo de convivencia.'],
    ['Cambiar rol', 'Podés cambiar entre: Usuario · Abogado Colegio · Admin directamente desde la ficha.'],
    ['Filtros rápidos', 'Todos · Usuarios · Abogados Colegio · Admins. Con contador de cada categoría.'],
    ['WhatsApp directo', 'Botón para abrir WhatsApp con el teléfono del usuario pre-cargado.'],
    ['Exportar Excel', 'Botón "Exportar Excel" → descarga base de datos completa con todos los campos.'],
  ]
  for (const [feat, desc] of userFeatures) {
    const y = doc.y
    doc.roundedRect(50, y, doc.page.width - 100, 32, 5).fill(LIGHT_GRAY)
    doc.rect(50, y, 4, 32).fill(BLUE)
    doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold').text('▸ ' + feat, 64, y + 5)
    doc.fontSize(8.5).fillColor(MID_GRAY).font('Helvetica').text(desc, 64, y + 18, { width: doc.page.width - 114 })
    doc.y = y + 39
  }

  doc.moveDown(0.3)
  sectionTitle(doc, '  MEMBRESÍAS ACTIVAS – MAYO 2026', GREEN)

  doc.fontSize(10).fillColor(DARK_GRAY).font('Helvetica')
     .text('Clientes con membresía mensual de horas activa:', 50, doc.y)
  doc.moveDown(0.4)

  const membActivas = [
    ['Fernando Piñeyro – Anatomía', 'BROMELIA', '160 hs/mes (40 hs/sem)', '$554.000 + IVA', '15% bonif. Miembro frecuente'],
    ['CeIATE', 'CALATHEA', '20 hs/mes (L-V 19-20hs)', '$285.000 + IVA', 'Precio con bonificación'],
    ['Camba Cua', 'POTHUS 2', '30 hs/mes', '$252.500', 'Miembro frecuente'],
    ['Nadia Medina – Modelaje', 'POTHUS REUN.', '20 hs/mes', '$343.800', 'Membresía mensual'],
    ['Club de Robótica', 'BEGONIA+POTHUS', '16+6 hs/mes', '$420.000', 'Begonia+Pothus+Locker'],
    ['PSA – Equipo Maie', 'PEPEROMIA', '21 hs/mes', '$209.000', 'Membresía mensual'],
    ['Distribuidora AWA', 'CALATHEA', '24 hs/mes', '$431.232', 'Fact A – Transferencia BP'],
    ['Academia Tales', 'BROMELIA+POTHUS', '16+8 hs', '$810.000 aprox.', 'Sáb 9 a 13hs'],
    ['Estudio Munaretto', 'PEPEROMIA', 'Trimestral', '$875.000', 'Abono trimestral'],
    ['Crowdar', 'POTHUS REUN.', '10 hs/mes', '$282.172', 'Membresía mensual'],
  ]

  for (const [cliente, sala, hs, precio, nota] of membActivas) {
    const y = doc.y
    doc.roundedRect(50, y, doc.page.width - 100, 30, 4).fill(LIGHT_GRAY)
    doc.rect(50, y, 3, 30).fill(GREEN)
    doc.fontSize(9).fillColor(NAVY).font('Helvetica-Bold').text(cliente, 60, y + 4, { width: 160 })
    doc.fontSize(8).fillColor(GREEN).font('Helvetica-Bold').text(sala, 225, y + 5)
    doc.fontSize(8).fillColor(MID_GRAY).font('Helvetica').text(hs, 60, y + 17, { width: 160 })
    doc.fontSize(8).fillColor(DARK_GRAY).font('Helvetica-Bold').text(precio, 225, y + 17)
    doc.fontSize(7.5).fillColor(MID_GRAY).font('Helvetica').text(nota, 330, y + 10, { width: doc.page.width - 380 })
    doc.y = y + 36
  }

  pageFooter(doc, 4, 5)
  doc.addPage()

  // ── Página 5: Colegio de Abogados + flujos rápidos
  header(doc, 'COLEGIO DE ABOGADOS', 'Beneficios y gestión del convenio')

  sectionTitle(doc, '  BENEFICIO MEMBRESÍA COLEGIO')
  doc.fontSize(10).fillColor(DARK_GRAY).font('Helvetica')
     .text('Los abogados registrados bajo el convenio con el Colegio de Abogados de Corrientes acceden a tarifas especiales:', 50, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.5)

  const beneficios = [
    ['1 hora gratuita por mes', 'En salas privadas pequeñas (Alocasia) sin costo.'],
    ['Bonificación 15%', 'En salas privadas de reunión respecto al precio de lista.'],
    ['Bonificación 20%', 'Para membresías de salas privadas.'],
    ['Bonificación 10%', 'En salas compartidas.'],
    ['Hasta 4 personas', 'La sala de 4 personas no tiene costo extra por acompañantes.'],
  ]
  for (const [b, d] of beneficios) {
    const y = doc.y
    doc.roundedRect(50, y, 180, 26, 4).fill('#7c3aed')
    doc.fontSize(9.5).fillColor(WHITE).font('Helvetica-Bold').text(b, 60, y + 7)
    doc.fontSize(9).fillColor(DARK_GRAY).font('Helvetica').text(d, 240, y + 8, { width: doc.page.width - 290 })
    doc.y = y + 33
  }

  doc.moveDown(0.3)
  sectionTitle(doc, '  RESERVAS DE ABOGADOS – MAYO (ejemplos reales)', '#7c3aed')
  const resAbogados = [
    ['Dario', 'Alocasia 15-16hs', '04/05'],
    ['Abo. Mario Longoni', 'Alocasia 16:30-17:30hs', '04/05'],
    ['Juana Capara', 'Alocasia 19-20hs', '04/05'],
    ['Cinthya Morales', 'Alocasia 09:30-10:30hs', '05/05'],
    ['Walter Rouvier', 'Alocasia 10:30-11:30hs', '05/05'],
    ['Paola + Adriana', 'Begonia 09-11hs', '05/05'],
    ['Octavio Biancioto', 'Alocasia 08-11hs', '06/05'],
    ['Claudia Romero', 'Alocasia 14-15hs', '06/05'],
    ['Laura Bestoso', 'Alocasia 16:30-17:30hs', '06/05'],
  ]
  for (const [abo, reserva, fecha] of resAbogados) {
    const y = doc.y
    doc.roundedRect(50, y, doc.page.width - 100, 20, 3).fill('#faf5ff')
    doc.rect(50, y, 3, 20).fill('#7c3aed')
    doc.fontSize(8.5).fillColor(NAVY).font('Helvetica-Bold').text(abo, 60, y + 5, { width: 170 })
    doc.fontSize(8.5).fillColor(MID_GRAY).font('Helvetica').text(reserva, 235, y + 5)
    doc.fontSize(8.5).fillColor('#7c3aed').font('Helvetica-Bold').text(fecha, doc.page.width - 90, y + 5)
    doc.y = y + 26
  }

  doc.moveDown(0.3)
  sectionTitle(doc, '  FLUJOS RÁPIDOS PARA ADMIN', ORANGE)

  const flujos = [
    ['Confirmar pago de reserva', 'Clic en el evento del calendario → "Registrar pago" → ingresar monto → guardar. El evento muestra ✅.'],
    ['Cancelar reserva', 'Clic en el evento → cambiar estado a "Cancelado/No vino" → guardar. El evento queda en rojo.'],
    ['Exportar base de clientes', 'Ir a Usuarios → "Exportar Excel" → se descarga el .xlsx con todos los datos.'],
    ['Exportar planilla del mes', 'Ir a Finanzas → seleccionar mes → "Excel" o "CSV" para descargar.'],
    ['Ver agenda del día', 'Hacer clic en cualquier día del calendario → el panel lateral muestra todas las reservas de ese día ordenadas por hora.'],
  ]

  for (const [titulo, desc] of flujos) {
    const y = doc.y
    doc.roundedRect(50, y, doc.page.width - 100, 34, 5).fill(LIGHT_GRAY)
    doc.rect(50, y, 4, 34).fill(ORANGE)
    doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold').text('▸ ' + titulo, 62, y + 5)
    doc.fontSize(8.5).fillColor(MID_GRAY).font('Helvetica').text(desc, 62, y + 19, { width: doc.page.width - 112 })
    doc.y = y + 41
  }

  pageFooter(doc, 5, 5)
  doc.end()
  console.log('✅ Manual del admin guardado en el Escritorio')
  return out
}

// ─── Ejecutar
console.log('\n📄 Generando PDFs de Oruga Coworking...\n')
crearGuiaCliente()
crearManualAdmin()
console.log('\n✅ Ambos PDFs generados en el Escritorio.')
