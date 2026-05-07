-- ============================================================
-- SolarOS - Indices de performance
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- Clientes
-- Listados recientes, filtros por etapa y busquedas operativas.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_updated_at_desc
  ON public.clientes (empresa_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_created_at_desc
  ON public.clientes (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_etapa_updated_at_desc
  ON public.clientes (empresa_id, etapa_pipeline, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm
  ON public.clientes USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clientes_telefono_trgm
  ON public.clientes USING gin (telefono gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clientes_numero_contrato_trgm
  ON public.clientes USING gin (numero_contrato gin_trgm_ops);

-- ============================================================
-- Inventario
-- Listados por categoria, sugerencias de equipo y alertas de stock.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inventario_empresa_activo_categoria_updated_at_desc
  ON public.inventario (empresa_id, activo, categoria, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventario_empresa_activo_updated_at_desc
  ON public.inventario (empresa_id, activo, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventario_marca_trgm
  ON public.inventario USING gin (marca gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_inventario_modelo_trgm
  ON public.inventario USING gin (modelo gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_inventario_descripcion_trgm
  ON public.inventario USING gin (descripcion gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_inventario_paneles_disponibles
  ON public.inventario (empresa_id, potencia_w DESC)
  WHERE activo = true
    AND categoria = 'panel_solar'
    AND stock_actual > 0;

CREATE INDEX IF NOT EXISTS idx_inventario_inversores_disponibles
  ON public.inventario (empresa_id, potencia_kw ASC)
  WHERE activo = true
    AND categoria = 'inversor'
    AND stock_actual > 0;

CREATE INDEX IF NOT EXISTS idx_inventario_bombas_disponibles
  ON public.inventario (empresa_id, potencia_hp ASC)
  WHERE activo = true
    AND categoria = 'bomba'
    AND stock_actual > 0;

CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo_activo
  ON public.inventario (empresa_id, updated_at DESC)
  WHERE activo = true
    AND stock_actual <= stock_minimo;

CREATE INDEX IF NOT EXISTS idx_inventario_movimientos_empresa_producto_fecha
  ON public.inventario_movimientos (empresa_id, producto_id, created_at DESC);

-- ============================================================
-- Cotizaciones
-- Dashboard, listados, filtros por estado y ultimas cotizaciones.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa_estado_created_at_desc
  ON public.cotizaciones (empresa_id, estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa_updated_at_desc
  ON public.cotizaciones (empresa_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_bombeo_empresa_estado_created_at_desc
  ON public.cotizaciones_bombeo (empresa_id, estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_bombeo_empresa_updated_at_desc
  ON public.cotizaciones_bombeo (empresa_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_electricas_empresa_estado_created_at_desc
  ON public.cotizaciones_electricas (empresa_id, estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_electricas_empresa_updated_at_desc
  ON public.cotizaciones_electricas (empresa_id, updated_at DESC);
