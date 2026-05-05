-- ============================================================
-- SolarOS — Schema inicial
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensión UUID (ya incluida en Supabase, pero por si acaso)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: empresas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa   TEXT NOT NULL,
  email            TEXT,
  telefono         TEXT,
  logo_url         TEXT,
  precio_wp        NUMERIC(10, 4) DEFAULT 0.65,
  tasa_dolar       NUMERIC(10, 2) DEFAULT 54,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: usuarios (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  rol        TEXT DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'tecnico')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre           TEXT NOT NULL,
  email            TEXT,
  telefono         TEXT,
  numero_contrato  TEXT,
  provincia        TEXT,
  notas            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: inventario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo            TEXT CHECK (tipo IN ('panel', 'inversor', 'bateria', 'otro')),
  marca           TEXT NOT NULL,
  modelo          TEXT NOT NULL,
  potencia_w      NUMERIC(10, 2),
  potencia_kw     NUMERIC(10, 2),
  precio_unitario NUMERIC(12, 2),
  stock           INTEGER DEFAULT 0,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: cotizaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id          UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero_cotizacion   TEXT NOT NULL,
  tipo_sistema        TEXT NOT NULL CHECK (tipo_sistema IN ('on_grid','off_grid','hibrido')),
  provincia           TEXT NOT NULL,
  tarifa              TEXT NOT NULL,

  -- Consumo
  kwh_mensual         NUMERIC(12, 2) NOT NULL,

  -- Cálculos
  horas_sol           NUMERIC(6, 2) NOT NULL,
  kwp_calculado       NUMERIC(10, 3) NOT NULL,
  generacion_mensual  NUMERIC(12, 2) NOT NULL,
  generacion_anual    NUMERIC(12, 2) NOT NULL,

  -- Equipo
  panel_marca         TEXT,
  panel_modelo        TEXT,
  panel_potencia_w    INTEGER,
  panel_cantidad      INTEGER,
  inversor_marca      TEXT,
  inversor_modelo     TEXT,
  inversor_kw         NUMERIC(10, 2),
  inversor_cantidad   INTEGER,

  -- Precio
  precio_wp           NUMERIC(10, 4) NOT NULL,
  total_usd           NUMERIC(14, 2) NOT NULL,

  -- Ley 57-07
  ley_5707_activa     BOOLEAN DEFAULT false,
  inversion_neta_usd  NUMERIC(14, 2),
  retorno_con_ley     NUMERIC(6, 1),
  retorno_sin_ley     NUMERIC(6, 1),

  -- Ahorro
  ahorro_mensual_rd   NUMERIC(14, 2),
  ahorro_anual_usd    NUMERIC(14, 2),
  tasa_dolar          NUMERIC(10, 2) DEFAULT 54,

  -- Estado y metadatos
  estado              TEXT DEFAULT 'borrador'
                        CHECK (estado IN ('borrador','enviada','aprobada','en_instalacion','completada','rechazada')),
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by          UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON public.cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created_at ON public.cotizaciones(created_at DESC);

-- ============================================================
-- TABLA: cotizacion_consumo_mensual
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cotizacion_consumo_mensual (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id  UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  mes            INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  consumo_kwh    NUMERIC(12, 2),
  generacion_kwh NUMERIC(12, 2),
  UNIQUE(cotizacion_id, mes)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.empresas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_consumo_mensual ENABLE ROW LEVEL SECURITY;

-- Función auxiliar: obtiene empresa_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.mi_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$;

-- ---- empresas ----
CREATE POLICY "ver_propia_empresa" ON public.empresas
  FOR SELECT USING (id = public.mi_empresa_id());

CREATE POLICY "actualizar_propia_empresa" ON public.empresas
  FOR UPDATE USING (id = public.mi_empresa_id());

-- ---- usuarios ----
CREATE POLICY "ver_usuarios_empresa" ON public.usuarios
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "ver_propio_usuario" ON public.usuarios
  FOR SELECT USING (id = auth.uid());

-- ---- clientes ----
CREATE POLICY "select_clientes" ON public.clientes
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "insert_clientes" ON public.clientes
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

CREATE POLICY "update_clientes" ON public.clientes
  FOR UPDATE USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "delete_clientes" ON public.clientes
  FOR DELETE USING (empresa_id = public.mi_empresa_id());

-- ---- inventario ----
CREATE POLICY "select_inventario" ON public.inventario
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "insert_inventario" ON public.inventario
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

CREATE POLICY "update_inventario" ON public.inventario
  FOR UPDATE USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "delete_inventario" ON public.inventario
  FOR DELETE USING (empresa_id = public.mi_empresa_id());

-- ---- cotizaciones ----
CREATE POLICY "select_cotizaciones" ON public.cotizaciones
  FOR SELECT USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "insert_cotizaciones" ON public.cotizaciones
  FOR INSERT WITH CHECK (empresa_id = public.mi_empresa_id());

CREATE POLICY "update_cotizaciones" ON public.cotizaciones
  FOR UPDATE USING (empresa_id = public.mi_empresa_id());

CREATE POLICY "delete_cotizaciones" ON public.cotizaciones
  FOR DELETE USING (empresa_id = public.mi_empresa_id());

-- ---- cotizacion_consumo_mensual ----
CREATE POLICY "select_consumo_mensual" ON public.cotizacion_consumo_mensual
  FOR SELECT USING (
    cotizacion_id IN (
      SELECT id FROM public.cotizaciones WHERE empresa_id = public.mi_empresa_id()
    )
  );

CREATE POLICY "insert_consumo_mensual" ON public.cotizacion_consumo_mensual
  FOR INSERT WITH CHECK (
    cotizacion_id IN (
      SELECT id FROM public.cotizaciones WHERE empresa_id = public.mi_empresa_id()
    )
  );

CREATE POLICY "delete_consumo_mensual" ON public.cotizacion_consumo_mensual
  FOR DELETE USING (
    cotizacion_id IN (
      SELECT id FROM public.cotizaciones WHERE empresa_id = public.mi_empresa_id()
    )
  );

-- ============================================================
-- FUNCIÓN: generar número de cotización secuencial
-- ============================================================
CREATE OR REPLACE FUNCTION public.generar_numero_cotizacion(p_empresa_id UUID)
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
  FROM public.cotizaciones
  WHERE empresa_id = p_empresa_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  RETURN 'COT-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;

-- ============================================================
-- TRIGGER: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_inventario_updated_at
  BEFORE UPDATE ON public.inventario
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_cotizaciones_updated_at
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- FUNCIÓN: crear usuario al registrarse (Auth Hook)
-- Llamar desde: Supabase → Auth → Hooks → After user creation
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserta el usuario en la tabla pública
  -- El empresa_id se asigna manualmente desde el onboarding
  INSERT INTO public.usuarios (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger en auth.users (requiere permisos de superusuario)
-- En Supabase Dashboard: Database → Triggers → New Trigger
-- Tabla: auth.users | Evento: INSERT | Función: handle_new_user

-- ============================================================
-- DATOS DE PRUEBA (comentar en producción)
-- ============================================================
/*
-- Crear empresa de prueba
INSERT INTO public.empresas (id, nombre_empresa, email, precio_wp, tasa_dolar)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'SolarTech RD',
  'admin@solartech.do',
  0.70,
  59
);
*/
