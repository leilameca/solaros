-- ============================================================
-- SolarOS - CRM de clientes
-- ============================================================

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS etapa_pipeline TEXT NOT NULL DEFAULT 'prospecto'
    CHECK (etapa_pipeline IN ('prospecto', 'cotizado', 'negociando', 'aprobado', 'instalado', 'perdido'));

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_pipeline
  ON public.clientes (empresa_id, etapa_pipeline, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.cliente_notas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nota       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cliente_notas_cliente_fecha
  ON public.cliente_notas (cliente_id, created_at DESC);

ALTER TABLE public.cliente_notas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_cliente_notas" ON public.cliente_notas;
CREATE POLICY "select_cliente_notas" ON public.cliente_notas
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "insert_cliente_notas" ON public.cliente_notas;
CREATE POLICY "insert_cliente_notas" ON public.cliente_notas
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "delete_cliente_notas" ON public.cliente_notas;
CREATE POLICY "delete_cliente_notas" ON public.cliente_notas
  FOR DELETE USING (empresa_id = public.mi_empresa_id());

DO $$
DECLARE
  sql_historial TEXT;
BEGIN
  sql_historial := '
    CREATE OR REPLACE VIEW public.historial_cliente AS
    SELECT
      c.id AS cliente_id,
      ''solar''::TEXT AS tipo,
      ''Solar''::TEXT AS tipo_label,
      cot.id AS cotizacion_id,
      cot.numero_cotizacion,
      cot.total_usd,
      cot.estado,
      cot.created_at,
      ''/cotizaciones/'' || cot.id::TEXT AS ruta
    FROM public.cotizaciones cot
    JOIN public.clientes c ON c.id = cot.cliente_id

    UNION ALL

    SELECT
      c.id AS cliente_id,
      ''bombeo''::TEXT AS tipo,
      ''Bombeo''::TEXT AS tipo_label,
      cot.id AS cotizacion_id,
      cot.numero_cotizacion,
      cot.total_usd,
      cot.estado,
      cot.created_at,
      ''/bombeo/'' || cot.id::TEXT AS ruta
    FROM public.cotizaciones_bombeo cot
    JOIN public.clientes c ON c.id = cot.cliente_id
  ';

  IF to_regclass('public.cotizaciones_electrico') IS NOT NULL THEN
    sql_historial := sql_historial || '
      UNION ALL

      SELECT
        c.id AS cliente_id,
        ''electrico''::TEXT AS tipo,
        ''Electrico''::TEXT AS tipo_label,
        cot.id AS cotizacion_id,
        cot.numero_cotizacion,
        cot.total_usd,
        cot.estado,
        cot.created_at,
        ''/electrico/'' || cot.id::TEXT AS ruta
      FROM public.cotizaciones_electrico cot
      JOIN public.clientes c ON c.id = cot.cliente_id
    ';
  END IF;

  EXECUTE sql_historial;
END $$;
