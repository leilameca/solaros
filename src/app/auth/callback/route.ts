import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sincronizarUsuarioDesdeAuth } from '@/lib/supabase/sync-user'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const siguienteRuta = url.searchParams.get('next') || '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No%20se%20recibio%20el%20codigo%20de%20acceso.', url.origin))
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    try {
      await sincronizarUsuarioDesdeAuth(user)
    } catch {
      return NextResponse.redirect(
        new URL('/login?error=No%20se%20pudo%20sincronizar%20tu%20usuario.', url.origin)
      )
    }
  }

  return NextResponse.redirect(new URL(siguienteRuta, url.origin))
}
