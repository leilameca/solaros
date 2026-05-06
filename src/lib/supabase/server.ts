import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPERADMIN_EMAIL } from '@/lib/permisos'

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Se llama desde un Server Component — cookies de lectura solamente
          }
        },
      },
    }
  )
}

// Obtiene el empresa_id del usuario autenticado
export async function obtenerEmpresaId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  return usuario?.empresa_id ?? null
}

// Obtiene la configuración de la empresa del usuario autenticado
export async function obtenerConfigEmpresa() {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()
  if (!empresaId) return null

  const { data } = await supabase
    .from('empresas')
    .select(
      'id, nombre_empresa, precio_wp, tasa_dolar, logo_url, email, telefono, rnc, direccion, provincia, representante, cargo_representante, color_primario, terminos_pdf, plan_actual, suscripcion_estado, trial_ends_at, suscripcion_renueva_en, suscripcion_monto_usd, stripe_customer_id, stripe_subscription_id, onboarding_completado'
    )
    .eq('id', empresaId)
    .single()

  return data
}

export async function obtenerUsuarioActual() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, empresa_id, nombre, email, rol, cargo, telefono, activo, created_at')
    .eq('id', user.id)
    .maybeSingle()

  return {
    authUser: user,
    usuario:
      usuario ?? {
        id: user.id,
        empresa_id: null,
        nombre:
          (typeof user.user_metadata?.nombre === 'string' && user.user_metadata.nombre) ||
          user.email?.split('@')[0] ||
          'Admin',
        email: user.email ?? '',
        rol: 'admin',
        cargo: null,
        telefono: null,
        activo: true,
        created_at: new Date().toISOString(),
      },
  }
}

export async function obtenerContextoUsuarioApp() {
  const contexto = await obtenerUsuarioActual()

  if (!contexto) {
    return {
      usuario: null,
      empresa: null,
    }
  }

  const { usuario, authUser } = contexto
  const esSuperadmin = (authUser.email ?? '').toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()

  let empresa = null

  if (usuario.empresa_id) {
    const supabase = createClient()
    const { data } = await supabase
      .from('empresas')
      .select('id, nombre_empresa, plan_actual, suscripcion_estado, onboarding_completado')
      .eq('id', usuario.empresa_id)
      .maybeSingle()

    if (data) {
      empresa = {
        id: data.id,
        nombre: data.nombre_empresa ?? '',
        plan_actual: data.plan_actual ?? 'basico',
        suscripcion_estado: data.suscripcion_estado ?? 'trial',
        onboarding_completado: data.onboarding_completado ?? false,
      }
    }
  }

  return {
    usuario: {
      id: usuario.id,
      empresa_id: usuario.empresa_id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      cargo: usuario.cargo ?? null,
      telefono: usuario.telefono ?? null,
      activo: usuario.activo ?? true,
      esSuperadmin,
    },
    empresa,
  }
}
