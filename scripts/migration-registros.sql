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
