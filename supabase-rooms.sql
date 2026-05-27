-- ============================================================
-- ORUGA COWORK — Salas reales y schema ampliado
-- Pegá esto en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Limpiar salas de ejemplo y cargar las reales
delete from rooms;

insert into rooms (name, capacity, price_per_hour, description) values
  ('Alocasia',   3,  6900,  'Sala privada chica. 1–3 personas. Referencia de precios. Uso frecuente por abogados.'),
  ('Begonia',    5,  6900,  'Sala privada. 3–5 personas. La más demandada.'),
  ('Pothus 2',   5,  6900,  'Sala privada. 3–5 personas. Planta baja.'),
  ('Pandurata',  5,  6900,  'Espacio compartido. 2 escritorios fijos.'),
  ('Peperomia',  8,  9000,  'Sala privada mediana. 6–8 personas.'),
  ('Calathea',   12, 11000, 'Sala privada grande. 10–12 personas. Planta alta.'),
  ('Pothus',     20, 15000, 'Sala de eventos / talleres. Hasta 20 personas.'),
  ('Bromelia',   30, 20000, 'Sala de eventos grande. Hasta 30 personas.');

-- Columnas extra en rooms
alter table rooms add column if not exists disponible boolean default true;
alter table rooms add column if not exists tipo text default 'privada';
alter table rooms add column if not exists escritorios_totales int default 0;

update rooms set tipo = 'compartida', escritorios_totales = 2 where name = 'Pandurata';
update rooms set tipo = 'eventos' where name in ('Pothus', 'Bromelia');

-- Columnas extra en bookings
alter table bookings add column if not exists precio_total numeric default 0;
alter table bookings add column if not exists monto_sena numeric default 0;
alter table bookings add column if not exists monto_pagado numeric default 0;
alter table bookings add column if not exists descuento_pct numeric default 0;
alter table bookings add column if not exists recargo_tarjeta boolean default false;
alter table bookings add column if not exists con_iva boolean default false;
alter table bookings add column if not exists medio_pago text default 'efectivo';
alter table bookings add column if not exists es_sabado boolean default false;
alter table bookings add column if not exists tipo_cliente text default 'externo';

-- Tabla de visitas
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  room_id uuid references rooms(id),
  fecha date not null default current_date,
  hora_entrada time not null,
  hora_salida time,
  horas_consumidas numeric,
  registrado_por text default 'admin',
  notas text,
  created_at timestamp default now()
);

alter table visits enable row level security;

-- Políticas visits (drop antes de crear para evitar conflicto)
drop policy if exists "Users can view own visits" on visits;
drop policy if exists "Admins can manage visits" on visits;

create policy "Users can view own visits" on visits for select using (auth.uid() = user_id);
create policy "Admins can manage visits" on visits for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Columnas extra en memberships
alter table memberships add column if not exists salas_asignadas text[] default '{}';
alter table memberships add column if not exists es_multiespacio boolean default false;
alter table memberships add column if not exists convenio text default 'ninguno';
alter table memberships add column if not exists medio_pago text default 'efectivo';
alter table memberships add column if not exists precio_pagado numeric default 0;
alter table memberships add column if not exists estado text default 'activo';

-- Columnas extra en transactions
alter table transactions add column if not exists tipo_comprobante text default 'recibo';
alter table transactions add column if not exists numero_comprobante text;
alter table transactions add column if not exists forma_pago text default 'efectivo';
alter table transactions add column if not exists monto_iva numeric default 0;
alter table transactions add column if not exists monto_neto numeric default 0;
alter table transactions add column if not exists cliente_proveedor text;
alter table transactions add column if not exists sala_servicio text;
alter table transactions add column if not exists observaciones text;
npm run dev
npm run dev
