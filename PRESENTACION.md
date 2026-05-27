# 🌿 Oruga Cowork — Demo & Roadmap

---

## 🎯 DEMO: Cómo mostrar el sistema

### Recorrido sugerido (10 minutos)

---

### 1. Vista del cliente (sin login) — 2 min
**URL:** `http://localhost:3000`

> *"Esto es lo que ve cualquier persona que entra al sitio."*

- Mostrar el **Calendario de disponibilidad** — las salas ocupadas en colores, los huecos libres en blanco
- Hacer click en un horario libre → se abre el formulario de solicitud de turno
- Mostrar que detecta conflictos en tiempo real si el horario ya está tomado
- Mostrar el botón de **WhatsApp** como alternativa

---

### 2. Login como admin — 1 min
**URL:** `http://localhost:3000/login`

- Ingresar con el email/password del admin
- Mostrar que aparece el **Panel Admin** en la barra de navegación

---

### 3. Calendario del admin — 2 min
**URL:** `http://localhost:3000/admin/calendar` (o Calendario)

> *"El admin ve todo: nombre del cliente, si pagó o no, estados."*

- Mostrar los colores por sala
- Mostrar los badges: ✅ pago completo, 🕐 pendiente, rojo = no vino
- Hacer click en una reserva → ver el detalle (monto, medio de pago, notas)
- Mostrar el **Panel diario** de la derecha con la agenda del día

---

### 4. Membresías — 2 min
**URL:** `http://localhost:3000/admin/memberships`

> *"Acá manejamos a los clientes con membresía mensual."*

- Mostrar la lista de miembros activos con horas disponibles
- Abrir uno → mostrar historial de pagos del mes
- Registrar un pago de ejemplo → ver cómo se descuenta del saldo

---

### 5. Finanzas — 3 min
**URL:** `http://localhost:3000/admin/finances`

> *"El dashboard financiero reemplaza la planilla de Excel."*

- Mostrar los **KPI cards**: Ingresos, Ingresado, Gastos, Pendientes
- Mostrar el **Balance del mes** en verde/rojo automático
- Mostrar los **gráficos** de flujo de caja y medio de pago
- Filtrar por tipo: Recibo / Fact A / Proveedor
- Buscar un coworker específico en el buscador
- Agregar una fila de ejemplo → ver cómo aparece en la tabla
- Exportar a Excel

---

## 🚀 PRÓXIMOS PASOS — Para dejarlo 100% funcional

### Paso 1: Subir a producción (Vercel) — 30 min
> El sistema hoy solo funciona en tu computadora. Para que clientes y equipo puedan usarlo desde cualquier lado hay que desplegarlo.

1. Crear cuenta en [vercel.com](https://vercel.com) (gratis)
2. Conectar el repositorio de GitHub
3. Agregar las variables de entorno (las del archivo `.env.local`)
4. Deploy automático — Vercel da una URL tipo `oruga-reservas.vercel.app`

**Costo:** $0 en el plan gratuito de Vercel

---

### Paso 2: Dominio propio — 1 hora
> En vez de `oruga-reservas.vercel.app` tener `reservas.orugacowork.com`

1. Comprar dominio en NIC.ar o Namecheap (~$15/año)
2. Apuntarlo a Vercel desde el panel de DNS
3. Vercel configura el SSL (https) automáticamente

---

### Paso 3: Notificaciones automáticas — 2-3 horas de desarrollo
> Cuando un cliente solicita un turno, el admin recibe un aviso inmediato.

**Opción A — WhatsApp (recomendado para empezar):**
- Integrar con **Twilio** o **WATI** — cuando llega una solicitud pendiente, manda un mensaje al admin
- Costo: desde $0 (Twilio tiene prueba gratis)

**Opción B — Email:**
- Usar **Resend** o **SendGrid** para enviar email automático
- "Hola Alan, nueva solicitud de [Nombre] para el [fecha] a las [hora]"
- Costo: $0 hasta 3.000 emails/mes

---

### Paso 4: Confirmación al cliente — 1-2 horas
> Hoy el admin confirma por WhatsApp manualmente. Esto lo automatiza.

- Cuando el admin aprueba una reserva pendiente → el sistema manda un mensaje/email automático al cliente
- "¡Tu reserva en Oruga está confirmada! 📅 [Sala] el [fecha] de [hora] a [hora]"

---

### Paso 5: Pago online (opcional, más adelante)
> Para que los clientes paguen la seña directamente desde el sistema.

- Integrar **Mercado Pago Checkout** con el botón de pago
- El sistema registra el pago automáticamente en la planilla de caja
- Costo: comisión de MP (3-6% por transacción)

---

## 🏗️ Stack técnico (para mostrar al equipo)

| Capa | Tecnología | Para qué |
|------|-----------|---------|
| Frontend | Next.js + React | La interfaz web |
| Estilos | Tailwind CSS | El diseño |
| Base de datos | Supabase (PostgreSQL) | Guarda reservas, usuarios, caja |
| Autenticación | Supabase Auth | Login seguro |
| Deploy | Vercel | Hosting |
| Gráficos | Recharts | Dashboard de finanzas |
| Calendario | FullCalendar | Vista de reservas |

---

## 💡 Lo que el sistema hace HOY

- ✅ Calendario de disponibilidad público
- ✅ Solicitud de turno por membresía desde el calendario
- ✅ Gestión completa de reservas (admin): crear, editar, cancelar
- ✅ Estados de reserva: confirmada / pendiente / cancelada / no vino
- ✅ Registro de pagos con medio de pago (efectivo, MP, banco)
- ✅ Membresías: horas totales, horas usadas, historial de pagos
- ✅ Dashboard financiero con KPIs y gráficos
- ✅ Planilla de caja con filtros, búsqueda y exportación a Excel
- ✅ Panel diario de agenda
- ✅ Multi-sala con colores por sala

## ⏳ Lo que falta para producción

- ⬜ Deploy en Vercel (hosting)
- ⬜ Dominio propio
- ⬜ Notificaciones automáticas al admin (WhatsApp/email)
- ⬜ Confirmación automática al cliente
- ⬜ Pago online (Mercado Pago) — opcional
