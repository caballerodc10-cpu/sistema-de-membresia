-- Agregar columnas al perfil para el sistema de registros mejorado
-- Ejecutar en Supabase Dashboard → SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo_profesional    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS convenio            text DEFAULT 'ninguno';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS matricula           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sala_preferida      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado_registro     text DEFAULT 'pendiente';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notas_admin         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiene_bonificacion  boolean DEFAULT false;

-- Índice para filtrar por estado rápido
CREATE INDEX IF NOT EXISTS idx_profiles_estado ON profiles(estado_registro);
CREATE INDEX IF NOT EXISTS idx_profiles_convenio ON profiles(convenio);

-- Portal de horas por empresa (link privado sin login)
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS portal_token text UNIQUE;

-- Tabla de gastos / egresos
CREATE TABLE IF NOT EXISTS expenses (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha       date NOT NULL DEFAULT CURRENT_DATE,
  concepto    text NOT NULL,
  monto       numeric NOT NULL,
  categoria   text DEFAULT 'general',
  metodo      text DEFAULT 'efectivo',
  notas       text,
  created_at  timestamptz DEFAULT now()
);
-- Solo admins pueden leer/escribir (o deshabilitar RLS si preferís)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON expenses USING (true) WITH CHECK (true);
