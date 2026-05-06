-- ============================================================
-- SolarOS - Modulo de inventario
-- ============================================================

ALTER TABLE public.inventario
  ADD COLUMN IF NOT EXISTS categoria TEXT,
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS potencia_hp NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS voltaje INTEGER,
  ADD COLUMN IF NOT EXISTS capacidad_kwh NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS stock_actual INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_minimo INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS unidad TEXT NOT NULL DEFAULT 'und',
  ADD COLUMN IF NOT EXISTS precio_costo_usd NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS precio_venta_usd NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS precio_rd NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

UPDATE public.inventario
SET categoria = CASE
  WHEN tipo = 'panel' THEN 'panel_solar'
  WHEN tipo = 'inversor' THEN 'inversor'
  WHEN tipo = 'bateria' THEN 'bateria'
  ELSE 'otro'
END
WHERE categoria IS NULL;

UPDATE public.inventario
SET descripcion = COALESCE(descripcion, notas),
    stock_actual = COALESCE(stock_actual, stock, 0),
    stock_minimo = COALESCE(stock_minimo, 2),
    unidad = COALESCE(NULLIF(unidad, ''), 'und'),
    precio_venta_usd = COALESCE(precio_venta_usd, precio_unitario),
    activo = COALESCE(activo, true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventario_categoria_check'
  ) THEN
    ALTER TABLE public.inventario
      ADD CONSTRAINT inventario_categoria_check
      CHECK (
        categoria IN (
          'panel_solar',
          'inversor',
          'bateria',
          'bomba',
          'vfd',
          'material_electrico',
          'accesorio',
          'otro'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventario_empresa_categoria
  ON public.inventario (empresa_id, categoria);

CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo
  ON public.inventario (empresa_id, activo, stock_actual, stock_minimo);

CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad INTEGER NOT NULL,
  stock_antes INTEGER NOT NULL,
  stock_despues INTEGER NOT NULL,
  motivo TEXT,
  cotizacion_id UUID,
  numero_cotizacion TEXT,
  precio_unit_usd NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_movimientos_inventario" ON public.inventario_movimientos;
CREATE POLICY "select_movimientos_inventario" ON public.inventario_movimientos
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "insert_movimientos_inventario" ON public.inventario_movimientos;
CREATE POLICY "insert_movimientos_inventario" ON public.inventario_movimientos
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

DROP POLICY IF EXISTS "update_movimientos_inventario" ON public.inventario_movimientos;
CREATE POLICY "update_movimientos_inventario" ON public.inventario_movimientos
  FOR UPDATE USING (empresa_id = public.mi_empresa_id());

CREATE INDEX IF NOT EXISTS idx_inventario_movimientos_producto_fecha
  ON public.inventario_movimientos (producto_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventario_movimientos_empresa_fecha
  ON public.inventario_movimientos (empresa_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.actualizar_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_delta INTEGER;
BEGIN
  v_delta := CASE
    WHEN NEW.tipo = 'entrada' THEN ABS(NEW.cantidad)
    WHEN NEW.tipo = 'salida' THEN ABS(NEW.cantidad) * -1
    ELSE NEW.cantidad
  END;

  UPDATE public.inventario
  SET stock_actual = COALESCE(stock_actual, 0) + v_delta,
      stock = COALESCE(stock_actual, stock, 0) + v_delta
  WHERE id = NEW.producto_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_actualizar_stock ON public.inventario_movimientos;
CREATE TRIGGER trg_actualizar_stock
  AFTER INSERT ON public.inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock();

CREATE OR REPLACE VIEW public.inventario_stock_bajo
WITH (security_invoker = true) AS
SELECT
  id,
  empresa_id,
  categoria,
  marca,
  modelo,
  stock_actual,
  stock_minimo,
  unidad,
  updated_at
FROM public.inventario
WHERE activo = true
  AND COALESCE(stock_actual, 0) <= COALESCE(stock_minimo, 0);
