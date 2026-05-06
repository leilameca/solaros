-- ============================================================
-- SolarOS — Módulo de servicios eléctricos
-- ============================================================

-- Catálogo de materiales por empresa
CREATE TABLE IF NOT EXISTS public.catalogo_materiales_electrico (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id           UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  descripcion          TEXT NOT NULL,
  unidad               TEXT NOT NULL DEFAULT 'unidad',
  precio_sugerido_rd   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  categoria            TEXT,
  activo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_mat_electrico_empresa
  ON public.catalogo_materiales_electrico(empresa_id);

ALTER TABLE public.catalogo_materiales_electrico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_catalogo_electrico" ON public.catalogo_materiales_electrico;
CREATE POLICY "select_catalogo_electrico" ON public.catalogo_materiales_electrico
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "insert_catalogo_electrico" ON public.catalogo_materiales_electrico;
CREATE POLICY "insert_catalogo_electrico" ON public.catalogo_materiales_electrico
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "update_catalogo_electrico" ON public.catalogo_materiales_electrico;
CREATE POLICY "update_catalogo_electrico" ON public.catalogo_materiales_electrico
  FOR UPDATE USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "delete_catalogo_electrico" ON public.catalogo_materiales_electrico;
CREATE POLICY "delete_catalogo_electrico" ON public.catalogo_materiales_electrico
  FOR DELETE USING (empresa_id = public.mi_empresa_id());

DROP TRIGGER IF EXISTS trg_catalogo_electrico_updated_at ON public.catalogo_materiales_electrico;
CREATE TRIGGER trg_catalogo_electrico_updated_at
  BEFORE UPDATE ON public.catalogo_materiales_electrico
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Cotizaciones eléctricas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cotizaciones_electricas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id              UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id              UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero_cotizacion       TEXT NOT NULL,
  tipo_trabajo            TEXT NOT NULL,
  descripcion             TEXT,
  mano_obra_rd            NUMERIC(14, 2) NOT NULL DEFAULT 0,
  subtotal_materiales_rd  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  itbis_rd                NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_rd                NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_usd               NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tasa_dolar              NUMERIC(10, 4) NOT NULL DEFAULT 54,
  estado                  TEXT NOT NULL DEFAULT 'borrador'
                            CHECK (estado IN ('borrador', 'enviada', 'aprobada',
                                              'en_instalacion', 'completada', 'rechazada')),
  notas                   TEXT,
  cotizacion_solar_id     UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
  cotizacion_bombeo_id    UUID REFERENCES public.cotizaciones_bombeo(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  created_by              UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,

  CONSTRAINT cotizaciones_electricas_empresa_numero_unique
    UNIQUE (empresa_id, numero_cotizacion)
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_electricas_empresa
  ON public.cotizaciones_electricas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_electricas_estado
  ON public.cotizaciones_electricas(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_electricas_created_at
  ON public.cotizaciones_electricas(created_at DESC);

ALTER TABLE public.cotizaciones_electricas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_cotizaciones_electricas" ON public.cotizaciones_electricas;
CREATE POLICY "select_cotizaciones_electricas" ON public.cotizaciones_electricas
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "insert_cotizaciones_electricas" ON public.cotizaciones_electricas;
CREATE POLICY "insert_cotizaciones_electricas" ON public.cotizaciones_electricas
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "update_cotizaciones_electricas" ON public.cotizaciones_electricas;
CREATE POLICY "update_cotizaciones_electricas" ON public.cotizaciones_electricas
  FOR UPDATE USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "delete_cotizaciones_electricas" ON public.cotizaciones_electricas;
CREATE POLICY "delete_cotizaciones_electricas" ON public.cotizaciones_electricas
  FOR DELETE USING (empresa_id = public.mi_empresa_id());

DROP TRIGGER IF EXISTS trg_cotizaciones_electricas_updated_at ON public.cotizaciones_electricas;
CREATE TRIGGER trg_cotizaciones_electricas_updated_at
  BEFORE UPDATE ON public.cotizaciones_electricas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Items de cotizaciones eléctricas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.items_cotizacion_electrica (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id    UUID NOT NULL
                     REFERENCES public.cotizaciones_electricas(id) ON DELETE CASCADE,
  descripcion      TEXT NOT NULL,
  unidad           TEXT NOT NULL DEFAULT 'unidad',
  cantidad         NUMERIC(10, 2) NOT NULL DEFAULT 1,
  precio_unit_rd   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  orden            INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_cotizacion_electrica_cotizacion
  ON public.items_cotizacion_electrica(cotizacion_id);

ALTER TABLE public.items_cotizacion_electrica ENABLE ROW LEVEL SECURITY;

-- RLS via JOIN: solo si la cotización pertenece a la empresa del JWT
DROP POLICY IF EXISTS "select_items_electrico" ON public.items_cotizacion_electrica;
CREATE POLICY "select_items_electrico" ON public.items_cotizacion_electrica
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones_electricas ce
      WHERE ce.id = cotizacion_id
        AND ce.empresa_id = public.mi_empresa_id()
    )
  );

DROP POLICY IF EXISTS "insert_items_electrico" ON public.items_cotizacion_electrica;
CREATE POLICY "insert_items_electrico" ON public.items_cotizacion_electrica
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cotizaciones_electricas ce
      WHERE ce.id = cotizacion_id
        AND ce.empresa_id = public.mi_empresa_id()
    )
  );

DROP POLICY IF EXISTS "update_items_electrico" ON public.items_cotizacion_electrica;
CREATE POLICY "update_items_electrico" ON public.items_cotizacion_electrica
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones_electricas ce
      WHERE ce.id = cotizacion_id
        AND ce.empresa_id = public.mi_empresa_id()
    )
  );

DROP POLICY IF EXISTS "delete_items_electrico" ON public.items_cotizacion_electrica;
CREATE POLICY "delete_items_electrico" ON public.items_cotizacion_electrica
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones_electricas ce
      WHERE ce.id = cotizacion_id
        AND ce.empresa_id = public.mi_empresa_id()
    )
  );

-- ============================================================
-- Función: generar número de cotización eléctrica
-- Formato: EL-YYYY-NNN
-- ============================================================

CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion_electrica(p_empresa_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year  TEXT;
  v_count INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COUNT(*) + 1
  INTO v_count
  FROM public.cotizaciones_electricas
  WHERE empresa_id = p_empresa_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  RETURN 'EL-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;
