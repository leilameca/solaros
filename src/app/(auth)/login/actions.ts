'use server'

import { createClient } from '@/lib/supabase/server'
import { normalizarErrorSupabase } from '@/lib/supabase/errores'
import { sincronizarUsuarioDesdeAuth } from '@/lib/supabase/sync-user'

export async function sincronizarUsuarioAutenticado(nombrePreferido?: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'No se pudo confirmar la sesion actual.' }
    }

    await sincronizarUsuarioDesdeAuth(user, { nombre: nombrePreferido })
    return { ok: true }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo preparar tu cuenta en SolarOS.',
    }
  }
}
