import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ConfiguracionEmpresaClient } from '@/components/configuracion/ConfiguracionEmpresaClient'
import { ConfiguracionSkeleton } from '@/components/configuracion/ConfiguracionSkeleton'
import { LIMITE_USUARIOS } from '@/lib/configuracion'
import { PRECIO_WP_DEFAULT } from '@/lib/constants'
import { createClient, obtenerUsuarioActual } from '@/lib/supabase/server'
import type {
  ConfiguracionEmpresaData,
  EmpresaConfiguracion,
  EstadoSuscripcionEmpresa,
  PlanSuscripcionEmpresa,
  RolUsuarioEmpresa,
  UsuarioEmpresa,
} from '@/types/configuracion'

const EMPRESA_VACIA: EmpresaConfiguracion = {
  id: null,
  nombre: '',
  rnc: '',
  telefono: '',
  email: '',
  direccion: '',
  provincia: '',
  representante: '',
  cargo_representante: '',
  logo_url: null,
  color_primario: '#C8860A',
  precio_wp: PRECIO_WP_DEFAULT,
  tasa_dolar: 54,
  terminos_pdf: '',
  plan_actual: 'basico',
  suscripcion_estado: 'trial',
  trial_ends_at: null,
  suscripcion_renueva_en: null,
  suscripcion_monto_usd: 10,
  stripe_customer_id: null,
  stripe_subscription_id: null,
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<ConfiguracionSkeleton />}>
      <ConfiguracionContenido />
    </Suspense>
  )
}

async function ConfiguracionContenido() {
  const contextoUsuario = await obtenerUsuarioActual()

  if (!contextoUsuario) {
    redirect('/login')
  }

  const { usuario } = contextoUsuario
  const tieneEmpresa = Boolean(usuario.empresa_id)

  if (tieneEmpresa && usuario.rol !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = createClient()

  const [empresaResult, usuariosResult] = await Promise.all([
    tieneEmpresa
      ? supabase
          .from('empresas')
          .select(
            'id, nombre_empresa, rnc, telefono, email, direccion, provincia, representante, cargo_representante, logo_url, color_primario, precio_wp, tasa_dolar, terminos_pdf, plan_actual, suscripcion_estado, trial_ends_at, suscripcion_renueva_en, suscripcion_monto_usd, stripe_customer_id, stripe_subscription_id'
          )
          .eq('id', usuario.empresa_id as string)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    tieneEmpresa
      ? supabase
          .from('usuarios')
          .select('id, nombre, email, rol, cargo, activo, created_at')
          .eq('empresa_id', usuario.empresa_id as string)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ])

  const empresa = empresaResult.data
    ? ({
        id: empresaResult.data.id,
        nombre: empresaResult.data.nombre_empresa ?? '',
        rnc: empresaResult.data.rnc ?? '',
        telefono: empresaResult.data.telefono ?? '',
        email: empresaResult.data.email ?? '',
        direccion: empresaResult.data.direccion ?? '',
        provincia: empresaResult.data.provincia ?? '',
        representante: empresaResult.data.representante ?? '',
        cargo_representante: empresaResult.data.cargo_representante ?? '',
        logo_url: empresaResult.data.logo_url ?? null,
        color_primario: empresaResult.data.color_primario ?? '#C8860A',
        precio_wp: Number(empresaResult.data.precio_wp ?? PRECIO_WP_DEFAULT),
        tasa_dolar: Number(empresaResult.data.tasa_dolar ?? 54),
        terminos_pdf: empresaResult.data.terminos_pdf ?? '',
        plan_actual: (empresaResult.data.plan_actual ?? 'pro') as PlanSuscripcionEmpresa,
        suscripcion_estado: (empresaResult.data.suscripcion_estado ?? 'trial') as EstadoSuscripcionEmpresa,
        trial_ends_at: empresaResult.data.trial_ends_at ?? null,
        suscripcion_renueva_en: empresaResult.data.suscripcion_renueva_en ?? null,
        suscripcion_monto_usd: Number(empresaResult.data.suscripcion_monto_usd ?? 59),
        stripe_customer_id: empresaResult.data.stripe_customer_id ?? null,
        stripe_subscription_id: empresaResult.data.stripe_subscription_id ?? null,
      } satisfies EmpresaConfiguracion)
    : EMPRESA_VACIA

  const usuarios: UsuarioEmpresa[] = (usuariosResult.data ?? []).map((item) => ({
    id: item.id,
    nombre: item.nombre ?? '',
    email: item.email ?? '',
    rol: ((item.rol ?? 'vendedor') as RolUsuarioEmpresa),
    cargo: item.cargo ?? null,
    activo: item.activo ?? true,
    created_at: item.created_at,
  }))

  const usuarioActual = {
    id: usuario.id,
    empresa_id: usuario.empresa_id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    cargo: usuario.cargo,
    activo: usuario.activo,
    created_at: usuario.created_at,
  }

  const planActual = empresa.plan_actual ?? 'pro'
  const limiteUsuarios = tieneEmpresa ? LIMITE_USUARIOS[planActual] : null
  const usuariosActivos = usuarios.filter((item) => item.activo).length

  const initialData: ConfiguracionEmpresaData = {
    usuarioActual,
    empresa,
    usuarios,
    modoInicial: !tieneEmpresa,
    usuariosActivos,
    limiteUsuarios,
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[24px] font-medium text-[var(--text)] tracking-[-0.03em]">
          Configuración
        </h1>
        <p className="text-[13px] text-[var(--text-3)]">
          Datos de empresa, apariencia, operativo, usuarios y suscripción.
        </p>
      </div>

      <ConfiguracionEmpresaClient initialData={initialData} />
    </div>
  )
}
