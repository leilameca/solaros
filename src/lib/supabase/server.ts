import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    .select('id, nombre_empresa, precio_wp, tasa_dolar, logo_url, email, telefono')
    .eq('id', empresaId)
    .single()

  return data
}
