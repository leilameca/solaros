-- ============================================================
-- SolarOS - Modulo de cotizaciones de bombeo
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cotizaciones_bombeo (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id           UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id           UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero_cotizacion    TEXT NOT NULL,
  tipo_sistema         TEXT NOT NULL CHECK (tipo_sistema IN ('solar_directo', 'solar_vfd', 'electrico')),
  tipo_bomba           TEXT NOT NULL CHECK (tipo_bomba IN ('sumergible', 'superficial')),
  provincia            TEXT,
  profundidad_m        NUMERIC(10, 2),
  caudal_m3h           NUMERIC(10, 2) NOT NULL,
  litros_dia_requeridos NUMERIC(12, 2) NOT NULL,
  altura_descarga_m    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  potencia_hp          NUMERIC(10, 2) NOT NULL,
  potencia_kw          NUMERIC(10, 3) NOT NULL,
  litros_disponibles   NUMERIC(12, 2),
  kwp_necesario        NUMERIC(10, 3),
  bomba_marca          TEXT,
  bomba_modelo         TEXT,
  bomba_hp             NUMERIC(10, 2),
  bomba_precio         NUMERIC(12, 2),
  panel_marca          TEXT,
  panel_modelo         TEXT,
  panel_w              INTEGER,
  panel_cantidad       INTEGER,
  panel_precio_unit    NUMERIC(12, 2),
  vfd_marca            TEXT,
  vfd_modelo           TEXT,
  vfd_kw               NUMERIC(10, 2),
  vfd_precio           NUMERIC(12, 2),
  instalacion_usd      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_usd            NUMERIC(14, 2) NOT NULL,
  estado               TEXT DEFAULT 'borrador'
                         CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'en_instalacion', 'completada', 'rechazada')),
  notas                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  created_by           UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,

  CONSTRAINT cotizaciones_bombeo_empresa_numero_unique UNIQUE (empresa_id, numero_cotizacion),
  CONSTRAINT cotizaciones_bombeo_provincia_solar_chk CHECK (
    tipo_sistema = 'electrico' OR provincia IS NOT NULL
  ),
  CONSTRAINT cotizaciones_bombeo_profundidad_sumergible_chk CHECK (
    tipo_bomba = 'superficial' OR profundidad_m IS NOT NULL
  ),
  CONSTRAINT cotizaciones_bombeo_paneles_solar_chk CHECK (
    tipo_sistema <> 'electrico'
    OR (
      panel_marca IS NULL
      AND panel_modelo IS NULL
      AND panel_w IS NULL
      AND panel_cantidad IS NULL
      AND panel_precio_unit IS NULL
      AND kwp_necesario IS NULL
    )
  ),
  CONSTRAINT cotizaciones_bombeo_vfd_chk CHECK (
    tipo_sistema = 'solar_vfd'
    OR (
      vfd_marca IS NULL
      AND vfd_modelo IS NULL
      AND vfd_kw IS NULL
      AND vfd_precio IS NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_bombeo_empresa ON public.cotizaciones_bombeo(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_bombeo_estado ON public.cotizaciones_bombeo(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_bombeo_created_at ON public.cotizaciones_bombeo(created_at DESC);

ALTER TABLE public.cotizaciones_bombeo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_cotizaciones_bombeo" ON public.cotizaciones_bombeo;
CREATE POLICY "select_cotizaciones_bombeo" ON public.cotizaciones_bombeo
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "insert_cotizaciones_bombeo" ON public.cotizaciones_bombeo;
CREATE POLICY "insert_cotizaciones_bombeo" ON public.cotizaciones_bombeo
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "update_cotizaciones_bombeo" ON public.cotizaciones_bombeo;
CREATE POLICY "update_cotizaciones_bombeo" ON public.cotizaciones_bombeo
  FOR UPDATE USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "delete_cotizaciones_bombeo" ON public.cotizaciones_bombeo;
CREATE POLICY "delete_cotizaciones_bombeo" ON public.cotizaciones_bombeo
  FOR DELETE USING (empresa_id = public.mi_empresa_id());

CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion_bombeo(p_empresa_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COUNT(*) + 1
  INTO v_count
  FROM public.cotizaciones_bombeo
  WHERE empresa_id = p_empresa_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  RETURN 'BOMB-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;

DROP TRIGGER IF EXISTS trg_cotizaciones_bombeo_updated_at ON public.cotizaciones_bombeo;
CREATE TRIGGER trg_cotizaciones_bombeo_updated_at
  BEFORE UPDATE ON public.cotizaciones_bombeo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
