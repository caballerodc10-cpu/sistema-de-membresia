-- ============================================================
-- ORUGA COWORK - Schema para Supabase
-- Pegá esto en: supabase.com → tu proyecto → SQL Editor → Run
-- ============================================================

-- Tabla de perfiles de usuario (se completa automáticamente al registrarse)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp default now()
);

-- Trigger: crea el perfil automáticamente cuando un usuario se registra
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Tabla de salas
create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int default 1,
  price_per_hour numeric default 0,
  description text,
  created_at timestamp default now()
);

-- Tabla de reservas
create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  start_time timestamp not null,
  end_time timestamp not null,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled', 'pending')),
  google_event_id text,
  notes text,
  created_at timestamp default now()
);

-- Tabla de membresías
create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan text not null,
  hours_total int default 0,
  hours_used int default 0,
  valid_until date,
  created_at timestamp default now()
);

-- Tabla de movimientos financieros
create table transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount numeric not null default 0,
  category text not null,
  description text not null,
  date date default current_date,
  booking_id uuid references bookings(id) on delete set null,
  created_at timestamp default now()
);

-- ============================================================
-- Permisos Row Level Security (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;
alter table memberships enable row level security;
alter table transactions enable row level security;

-- Profiles: cada usuario ve su propio perfil; admin ve todos
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update all profiles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Rooms: cualquier usuario autenticado puede ver; solo admin puede modificar
create policy "Authenticated users can view rooms" on rooms for select using (auth.role() = 'authenticated');
create policy "Admins can manage rooms" on rooms for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Bookings: cada usuario ve sus propias; admin ve todas
create policy "Users can view own bookings" on bookings for select using (auth.uid() = user_id);
create policy "Users can create bookings" on bookings for insert with check (auth.uid() = user_id);
create policy "Users can update own bookings" on bookings for update using (auth.uid() = user_id);
create policy "Admins can manage all bookings" on bookings for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Memberships: cada usuario ve la suya; admin gestiona todas
create policy "Users can view own membership" on memberships for select using (auth.uid() = user_id);
create policy "Admins can manage memberships" on memberships for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Transactions: solo admin
create policy "Admins can manage transactions" on transactions for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- Datos de ejemplo (salas)
-- ============================================================
insert into rooms (name, capacity, price_per_hour, description) values
  ('Sala A', 4, 2500, 'Sala chica, ideal para reuniones pequeñas'),
  ('Sala B', 8, 4000, 'Sala mediana con proyector'),
  ('Sala Principal', 16, 8000, 'Sala grande para capacitaciones y eventos');
