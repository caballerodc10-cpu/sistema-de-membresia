-- Fix: permitir que el trigger inserte perfiles automáticamente
create policy "Service role can insert profiles" on profiles
  for insert with check (true);

-- Fix: asegurarse que el trigger tiene permisos correctos
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ============================================================
-- FIX: Asignar rol admin al usuario administrador
-- Ejecutar en: supabase.com → tu proyecto → SQL Editor → Run
-- ============================================================
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'caballerodc.10@gmail.com';
