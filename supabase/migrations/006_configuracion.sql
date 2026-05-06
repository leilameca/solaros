-- ============================================================
-- SolarOS - Configuracion de empresa
-- ============================================================

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS rnc TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS provincia TEXT,
  ADD COLUMN IF NOT EXISTS representante TEXT,
  ADD COLUMN IF NOT EXISTS cargo_representante TEXT,
  ADD COLUMN IF NOT EXISTS color_primario TEXT NOT NULL DEFAULT '#C8860A',
  ADD COLUMN IF NOT EXISTS terminos_pdf TEXT,
  ADD COLUMN IF NOT EXISTS plan_actual TEXT NOT NULL DEFAULT 'basico',
  ADD COLUMN IF NOT EXISTS suscripcion_estado TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 months'),
  ADD COLUMN IF NOT EXISTS suscripcion_renueva_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suscripcion_monto_usd NUMERIC(10, 2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS cargo TEXT,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'empresas_plan_actual_check'
  ) THEN
    ALTER TABLE public.empresas
      ADD CONSTRAINT empresas_plan_actual_check
      CHECK (plan_actual IN ('basico', 'pro', 'enterprise'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'empresas_suscripcion_estado_check'
  ) THEN
    ALTER TABLE public.empresas
      ADD CONSTRAINT empresas_suscripcion_estado_check
      CHECK (suscripcion_estado IN ('trial', 'activa', 'cancelada', 'vencida'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_activo
  ON public.usuarios (empresa_id, activo);

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Buckets requeridos (crear manualmente en Supabase Storage):
--   logos       -> publico
--   propuestas  -> publico
