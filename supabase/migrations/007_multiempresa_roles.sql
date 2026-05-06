-- ============================================================
-- SolarOS - Multiempresa, roles y onboarding
-- ============================================================

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefono TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'empresas_suscripcion_estado_check'
  ) THEN
    ALTER TABLE public.empresas
      DROP CONSTRAINT empresas_suscripcion_estado_check;
  END IF;
END $$;

ALTER TABLE public.empresas
  ADD CONSTRAINT empresas_suscripcion_estado_check
  CHECK (suscripcion_estado IN ('trial', 'activa', 'vencida', 'suspendida', 'cancelada'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (
    id,
    empresa_id,
    nombre,
    email,
    rol,
    cargo,
    telefono,
    activo
  )
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'empresa_id', '')::uuid,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'nombre', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'rol', ''), 'vendedor'),
    NULLIF(NEW.raw_user_meta_data ->> 'cargo', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'telefono', ''),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    empresa_id = COALESCE(public.usuarios.empresa_id, EXCLUDED.empresa_id),
    nombre = COALESCE(NULLIF(public.usuarios.nombre, ''), EXCLUDED.nombre),
    email = COALESCE(NULLIF(public.usuarios.email, ''), EXCLUDED.email),
    rol = COALESCE(public.usuarios.rol, EXCLUDED.rol),
    cargo = COALESCE(public.usuarios.cargo, EXCLUDED.cargo),
    telefono = COALESCE(public.usuarios.telefono, EXCLUDED.telefono),
    activo = true,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
