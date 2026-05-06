-- Aggregates inventory metrics in one DB call
-- Replaces full product scan in obtenerMetricasInventario
CREATE OR REPLACE FUNCTION public.metricas_inventario(p_empresa_id UUID)
RETURNS TABLE(
  total_activos   BIGINT,
  stock_bajo      BIGINT,
  valor_total_usd NUMERIC
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE stock_actual <= stock_minimo),
    COALESCE(SUM(
      stock_actual * COALESCE(precio_costo_usd, precio_venta_usd, precio_unitario, 0)
    ), 0)
  FROM inventario
  WHERE empresa_id = p_empresa_id
    AND activo = true;
$$;
