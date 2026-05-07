-- Módulo de planes de pago y cobros por proyecto

CREATE TABLE planes_pago (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id),
  cotizacion_id    UUID NOT NULL,
  cotizacion_tipo  TEXT NOT NULL CHECK (cotizacion_tipo IN ('solar', 'bombeo', 'electrico')),
  numero_cotizacion TEXT NOT NULL,
  cliente_id       UUID REFERENCES clientes(id),
  cliente_nombre   TEXT NOT NULL,
  total_usd        NUMERIC(12,2) NOT NULL,
  total_rd         NUMERIC(14,2),
  moneda           TEXT DEFAULT 'USD' CHECK (moneda IN ('USD', 'RD')),
  plan_tipo        TEXT NOT NULL CHECK (
    plan_tipo IN ('50_50', '25_25_50', '100_final', '100_inicio', 'personalizado')
  ),
  estado           TEXT DEFAULT 'activo' CHECK (
    estado IN ('activo', 'completado', 'cancelado')
  ),
  notas            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       UUID REFERENCES usuarios(id)
);

CREATE TABLE plan_pago_cuotas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             UUID NOT NULL REFERENCES planes_pago(id) ON DELETE CASCADE,
  empresa_id          UUID NOT NULL REFERENCES empresas(id),
  orden               INTEGER NOT NULL,
  porcentaje          NUMERIC(5,2) NOT NULL,
  monto_usd           NUMERIC(12,2) NOT NULL,
  monto_rd            NUMERIC(14,2),
  condicion           TEXT NOT NULL,
  fecha_limite        DATE,
  estado              TEXT DEFAULT 'pendiente' CHECK (
    estado IN ('pendiente', 'pagado', 'vencido', 'cancelado')
  ),
  fecha_pago          DATE,
  metodo_pago         TEXT,
  referencia_pago     TEXT,
  monto_recibido_usd  NUMERIC(12,2),
  comprobante_url     TEXT,
  notas_pago          TEXT,
  registrado_por      UUID REFERENCES usuarios(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_planes_pago_empresa     ON planes_pago(empresa_id);
CREATE INDEX idx_planes_pago_cotizacion  ON planes_pago(cotizacion_id);
CREATE INDEX idx_cuotas_plan             ON plan_pago_cuotas(plan_id);
CREATE INDEX idx_cuotas_empresa_estado   ON plan_pago_cuotas(empresa_id, estado);
CREATE INDEX idx_cuotas_fecha            ON plan_pago_cuotas(empresa_id, fecha_limite)
  WHERE estado = 'pendiente';

-- RLS
ALTER TABLE planes_pago      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_pago_cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_planes_pago" ON planes_pago
  USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "empresa_cuotas_pago" ON plan_pago_cuotas
  USING (empresa_id = public.mi_empresa_id());

-- Triggers updated_at
CREATE TRIGGER trg_planes_pago_updated_at
  BEFORE UPDATE ON planes_pago
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cuotas_updated_at
  BEFORE UPDATE ON plan_pago_cuotas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Marcar cuotas vencidas — llamar al abrir /cobros para mantener estados frescos
CREATE OR REPLACE FUNCTION public.actualizar_cuotas_vencidas(p_empresa_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE plan_pago_cuotas
       SET estado = 'vencido', updated_at = NOW()
     WHERE empresa_id    = p_empresa_id
       AND estado        = 'pendiente'
       AND fecha_limite  IS NOT NULL
       AND fecha_limite  < CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER FROM updated;
$$;

-- Métricas de cobros para el dashboard
CREATE OR REPLACE FUNCTION public.metricas_cobros(p_empresa_id UUID)
RETURNS TABLE(
  por_cobrar_mes  NUMERIC,
  cobrado_mes     NUMERIC,
  vencidas_count  BIGINT,
  proximas_count  BIGINT
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(monto_usd) FILTER (
      WHERE estado IN ('pendiente', 'vencido')
        AND fecha_limite >= DATE_TRUNC('month', CURRENT_DATE)::DATE
        AND fecha_limite <  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
    ), 0),
    COALESCE(SUM(COALESCE(monto_recibido_usd, monto_usd)) FILTER (
      WHERE estado     = 'pagado'
        AND fecha_pago >= DATE_TRUNC('month', CURRENT_DATE)::DATE
    ), 0),
    COUNT(*) FILTER (WHERE estado = 'vencido'),
    COUNT(*) FILTER (
      WHERE estado        = 'pendiente'
        AND fecha_limite  IS NOT NULL
        AND fecha_limite  >= CURRENT_DATE
        AND fecha_limite  <  CURRENT_DATE + 7
    )
  FROM plan_pago_cuotas
  WHERE empresa_id = p_empresa_id;
$$;

-- Nota: crear el bucket 'comprobantes' en Supabase Storage (privado)
-- con política: los usuarios autenticados de la misma empresa pueden
-- leer/escribir en la ruta {empresa_id}/{plan_id}/{cuota_id}.*
