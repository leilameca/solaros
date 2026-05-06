-- ============================================================
-- SolarOS - Dashboard y metricas
-- ============================================================

CREATE OR REPLACE FUNCTION public.ultimas_cotizaciones(
  p_empresa_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  tipo TEXT,
  tipo_label TEXT,
  cotizacion_id UUID,
  numero_cotizacion TEXT,
  cliente_nombre TEXT,
  total_usd NUMERIC,
  estado TEXT,
  created_at TIMESTAMPTZ,
  ruta TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  IF auth.uid() IS NOT NULL AND p_empresa_id IS DISTINCT FROM public.mi_empresa_id() THEN
    RAISE EXCEPTION 'No autorizado para consultar estas cotizaciones';
  END IF;

  sql_query := '
    SELECT *
    FROM (
      SELECT
        ''solar''::TEXT AS tipo,
        ''Solar''::TEXT AS tipo_label,
        cot.id AS cotizacion_id,
        cot.numero_cotizacion,
        COALESCE(cli.nombre, ''Cliente sin nombre'') AS cliente_nombre,
        cot.total_usd,
        cot.estado,
        cot.created_at,
        ''/cotizaciones/'' || cot.id::TEXT AS ruta
      FROM public.cotizaciones cot
      LEFT JOIN public.clientes cli ON cli.id = cot.cliente_id
      WHERE cot.empresa_id = $1

      UNION ALL

      SELECT
        ''bombeo''::TEXT AS tipo,
        ''Bombeo''::TEXT AS tipo_label,
        cot.id AS cotizacion_id,
        cot.numero_cotizacion,
        COALESCE(cli.nombre, ''Cliente sin nombre'') AS cliente_nombre,
        cot.total_usd,
        cot.estado,
        cot.created_at,
        ''/bombeo/'' || cot.id::TEXT AS ruta
      FROM public.cotizaciones_bombeo cot
      LEFT JOIN public.clientes cli ON cli.id = cot.cliente_id
      WHERE cot.empresa_id = $1
  ';

  IF to_regclass('public.cotizaciones_electrico') IS NOT NULL THEN
    sql_query := sql_query || '
      UNION ALL

      SELECT
        ''electrico''::TEXT AS tipo,
        ''Electrico''::TEXT AS tipo_label,
        cot.id AS cotizacion_id,
        cot.numero_cotizacion,
        COALESCE(cli.nombre, ''Cliente sin nombre'') AS cliente_nombre,
        cot.total_usd,
        cot.estado,
        cot.created_at,
        ''/electrico/'' || cot.id::TEXT AS ruta
      FROM public.cotizaciones_electrico cot
      LEFT JOIN public.clientes cli ON cli.id = cot.cliente_id
      WHERE cot.empresa_id = $1
    ';
  END IF;

  sql_query := sql_query || '
    ) AS cotizaciones_unificadas
    ORDER BY created_at DESC
    LIMIT $2
  ';

  RETURN QUERY EXECUTE sql_query USING p_empresa_id, p_limit;
END;
$$;
