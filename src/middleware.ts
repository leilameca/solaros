import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPERADMIN_EMAIL } from '@/lib/permisos'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const esRutaPublica =
    pathname.startsWith('/login') ||
    pathname.startsWith('/registro') ||
    pathname.startsWith('/auth')

  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user) {
    return supabaseResponse
  }

  const esSuperadmin = (user.email ?? '').toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .maybeSingle()

  let empresa: {
    onboarding_completado?: boolean | null
    suscripcion_estado?: string | null
  } | null = null

  if (usuario?.empresa_id) {
    const { data } = await supabase
      .from('empresas')
      .select('onboarding_completado, suscripcion_estado')
      .eq('id', usuario.empresa_id)
      .maybeSingle()

    empresa = data
  }

  if (pathname.startsWith('/admin') && !esSuperadmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' || pathname === '/registro') {
    const url = request.nextUrl.clone()
    url.pathname =
      empresa && empresa.onboarding_completado === false ? '/onboarding' : '/dashboard'
    return NextResponse.redirect(url)
  }

  if (!esSuperadmin && !usuario?.empresa_id && !pathname.startsWith('/configuracion')) {
    const url = request.nextUrl.clone()
    url.pathname = '/configuracion'
    return NextResponse.redirect(url)
  }

  if (
    empresa?.onboarding_completado === false &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/configuracion') &&
    !pathname.startsWith('/admin')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  if (
    pathname.startsWith('/configuracion') &&
    !esSuperadmin &&
    usuario?.empresa_id &&
    usuario.rol !== 'admin'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (
    empresa?.suscripcion_estado === 'suspendida' &&
    !pathname.startsWith('/configuracion') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/onboarding')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/configuracion'
    return NextResponse.redirect(url)
  }

  if (
    pathname.startsWith('/inventario') &&
    !esSuperadmin &&
    empresa &&
    usuario?.empresa_id &&
    empresa.onboarding_completado !== false
  ) {
    const { data: plan } = await supabase
      .from('empresas')
      .select('plan_actual')
      .eq('id', usuario.empresa_id)
      .maybeSingle()

    if (plan?.plan_actual === 'basico') {
      const url = request.nextUrl.clone()
      url.pathname = '/configuracion'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
