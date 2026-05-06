-- ============================================================
-- MÓDULO: Propuestas PDF
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Tabla de registro de PDFs generados y compartidos
CREATE TABLE IF NOT EXISTS propuestas_generadas (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id         UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo               TEXT        NOT NULL CHECK (tipo IN ('solar', 'bombeo', 'electrico')),
  cotizacion_id      UUID        NOT NULL,
  numero_cotizacion  TEXT        NOT NULL,
  storage_path       TEXT,
  url_publica        TEXT,
  generado_por       UUID        REFERENCES usuarios(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS propuestas_generadas_empresa_idx
  ON propuestas_generadas (empresa_id);

CREATE INDEX IF NOT EXISTS propuestas_generadas_cotizacion_idx
  ON propuestas_generadas (cotizacion_id);

-- Row Level Security
ALTER TABLE propuestas_generadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_propuestas_generadas" ON propuestas_generadas
  USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "empresa_propuestas_generadas_insert" ON propuestas_generadas
  FOR INSERT
  WITH CHECK (empresa_id = public.mi_empresa_id());

-- ============================================================
-- STORAGE BUCKET
-- No se puede crear con SQL — hacerlo en el Dashboard de Supabase:
--
-- 1. Ir a Storage → New bucket
-- 2. Nombre: propuestas
-- 3. Marcar como Public bucket: SÍ
-- 4. Allowed MIME types: application/pdf
-- 5. Max upload size: 10 MB
--
-- O usar el API de Supabase:
-- await supabase.storage.createBucket('propuestas', { public: true })
-- ============================================================
