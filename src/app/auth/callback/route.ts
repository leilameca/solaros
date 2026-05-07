import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sincronizarUsuarioDesdeAuth } from '@/lib/supabase/sync-user'

function normalizarSiguienteRuta(siguienteRuta: string | null) {
  if (!siguienteRuta || !siguienteRuta.startsWith('/')) {
    return '/dashboard'
  }

  return siguienteRuta
}

function crearClienteCallback(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const siguienteRuta = normalizarSiguienteRuta(url.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No%20se%20recibio%20el%20codigo%20de%20acceso.', url.origin))
  }

  const response = NextResponse.redirect(new URL(siguienteRuta, url.origin))
  const supabase = crearClienteCallback(request, response)
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=No%20se%20pudo%20confirmar%20la%20sesion%20de%20Google.', url.origin)
    )
  }

  try {
    await sincronizarUsuarioDesdeAuth(user)
  } catch {
    return NextResponse.redirect(
      new URL('/login?error=No%20se%20pudo%20sincronizar%20tu%20usuario.', url.origin)
    )
  }

  return response
}
