-- Aggregates all 5 dashboard metrics in one DB call via UNION ALL + FILTER
-- Replaces 3x unbounded table scans in dashboard.ts
CREATE OR REPLACE FUNCTION public.metricas_dashboard(
  p_empresa_id UUID,
  p_inicio_mes TIMESTAMPTZ
)
RETURNS TABLE(
  cotizaciones_mes  BIGINT,
  aprobadas_mes     BIGINT,
  en_instalacion    BIGINT,
  valor_pipeline    NUMERIC,
  valor_cerrado_mes NUMERIC
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH todas AS (
    SELECT estado, total_usd, created_at, updated_at
      FROM cotizaciones WHERE empresa_id = p_empresa_id
    UNION ALL
    SELECT estado, total_usd, created_at, updated_at
      FROM cotizaciones_bombeo WHERE empresa_id = p_empresa_id
    UNION ALL
    SELECT estado, total_usd, created_at, updated_at
      FROM cotizaciones_electricas WHERE empresa_id = p_empresa_id
  )
  SELECT
    COUNT(*) FILTER (WHERE created_at >= p_inicio_mes),
    COUNT(*) FILTER (WHERE estado = 'aprobada' AND created_at >= p_inicio_mes),
    COUNT(*) FILTER (WHERE estado = 'en_instalacion'),
    COALESCE(SUM(total_usd) FILTER (WHERE estado IN ('borrador', 'enviada')), 0),
    COALESCE(SUM(total_usd) FILTER (WHERE estado IN ('aprobada', 'en_instalacion', 'completada') AND updated_at >= p_inicio_mes), 0)
  FROM todas;
$$;
