-- Configuración global de la app
-- Ejecutar en Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS app_settings (
  id                    text PRIMARY KEY DEFAULT 'main',
  google_cal_embed_url  text,   -- URL iframe del Google Calendar (vista pública)
  google_cal_edit_url   text,   -- URL editable del Google Calendar (solo admin)
  calendar_feed_token   text,   -- Token para el feed ICS (generado automáticamente)
  updated_at            timestamptz DEFAULT now()
);

-- Insertar fila única si no existe
INSERT INTO app_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;
