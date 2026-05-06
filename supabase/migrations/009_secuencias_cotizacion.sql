-- ============================================================
-- SolarOS — Secuencias atómicas de numeración de cotizaciones
-- Reemplaza COUNT(*)+1 con tabla de secuencias para evitar
-- colisiones bajo carga concurrente.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cotizacion_secuencias (
  empresa_id  UUID    NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo        TEXT    NOT NULL CHECK (tipo IN ('solar', 'bombeo', 'electrico')),
  anio        INTEGER NOT NULL,
  ultimo      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (empresa_id, tipo, anio)
);

-- Backfill: poblar la tabla con los conteos actuales por empresa/año
-- para que las nuevas cotizaciones continúen la secuencia existente.
INSERT INTO public.cotizacion_secuencias (empresa_id, tipo, anio, ultimo)
SELECT
  empresa_id,
  'solar' AS tipo,
  EXTRACT(YEAR FROM created_at)::INTEGER AS anio,
  COUNT(*) AS ultimo
FROM public.cotizaciones
GROUP BY empresa_id, EXTRACT(YEAR FROM created_at)
ON CONFLICT (empresa_id, tipo, anio) DO UPDATE
  SET ultimo = EXCLUDED.ultimo;

INSERT INTO public.cotizacion_secuencias (empresa_id, tipo, anio, ultimo)
SELECT
  empresa_id,
  'bombeo' AS tipo,
  EXTRACT(YEAR FROM created_at)::INTEGER AS anio,
  COUNT(*) AS ultimo
FROM public.cotizaciones_bombeo
GROUP BY empresa_id, EXTRACT(YEAR FROM created_at)
ON CONFLICT (empresa_id, tipo, anio) DO UPDATE
  SET ultimo = EXCLUDED.ultimo;

INSERT INTO public.cotizacion_secuencias (empresa_id, tipo, anio, ultimo)
SELECT
  empresa_id,
  'electrico' AS tipo,
  EXTRACT(YEAR FROM created_at)::INTEGER AS anio,
  COUNT(*) AS ultimo
FROM public.cotizaciones_electricas
GROUP BY empresa_id, EXTRACT(YEAR FROM created_at)
ON CONFLICT (empresa_id, tipo, anio) DO UPDATE
  SET ultimo = EXCLUDED.ultimo;

-- RLS en la tabla de secuencias
ALTER TABLE public.cotizacion_secuencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_secuencias" ON public.cotizacion_secuencias;
CREATE POLICY "select_secuencias" ON public.cotizacion_secuencias
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

-- ============================================================
-- Función base: incremento atómico
-- Usa INSERT ... ON CONFLICT DO UPDATE que es atómica en PostgreSQL.
-- ============================================================
CREATE OR REPLACE FUNCTION public.siguiente_numero_cotizacion(
  p_empresa_id UUID,
  p_tipo       TEXT,
  p_prefijo    TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_anio  INTEGER;
  v_num   INTEGER;
BEGIN
  v_anio := EXTRACT(YEAR FROM NOW())::INTEGER;

  INSERT INTO public.cotizacion_secuencias (empresa_id, tipo, anio, ultimo)
  VALUES (p_empresa_id, p_tipo, v_anio, 1)
  ON CONFLICT (empresa_id, tipo, anio) DO UPDATE
    SET ultimo = cotizacion_secuencias.ultimo + 1
  RETURNING ultimo INTO v_num;

  RETURN p_prefijo || '-' || v_anio::TEXT || '-' || LPAD(v_num::TEXT, 3, '0');
END;
$$;

-- ============================================================
-- Actualizar las 3 funciones públicas para usar la nueva lógica
-- ============================================================

CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion(p_empresa_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.siguiente_numero_cotizacion(p_empresa_id, 'solar', 'COT');
END;
$$;

CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion_bombeo(p_empresa_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.siguiente_numero_cotizacion(p_empresa_id, 'bombeo', 'BOMB');
END;
$$;

CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion_electrica(p_empresa_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.siguiente_numero_cotizacion(p_empresa_id, 'electrico', 'EL');
END;
$$;
