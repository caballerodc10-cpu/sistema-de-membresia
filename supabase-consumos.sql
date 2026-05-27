-- Tabla de consumos (café, impresiones, etc.)
create table if not exists consumos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  user_name text not null,
  sala text,
  tipo text not null check (tipo in ('cafe', 'impresion', 'locker', 'otro')),
  cantidad int default 1,
  precio_unit numeric default 0,
  total numeric default 0,
  notas text,
  created_at timestamp default now()
);

alter table consumos enable row level security;

drop policy if exists "Admins can manage consumos" on consumos;
create policy "Admins can manage consumos" on consumos for all using (true);
