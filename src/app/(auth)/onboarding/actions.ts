'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarErrorSupabase } from '@/lib/supabase/errores'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { PRECIO_WP_DEFAULT } from '@/lib/constants'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const TIPOS_LOGO_PERMITIDOS = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

export async function completarOnboarding(formData: FormData) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const empresaId = await obtenerEmpresaId()

    if (!empresaId) {
      return { error: 'No encontramos una empresa asociada a este usuario.' }
    }

    const precioWp = Number(formData.get('precio_wp') ?? PRECIO_WP_DEFAULT)
    const tasaDolar = Number(formData.get('tasa_dolar') ?? 54)
    const archivo = formData.get('logo')
    const admin = createAdminClient()

    let logoUrl: string | null = null

    if (archivo instanceof File && archivo.size > 0) {
      if (!TIPOS_LOGO_PERMITIDOS.has(archivo.type)) {
        return { error: 'El logo debe ser PNG, JPG o WebP.' }
      }

      if (archivo.size > MAX_LOGO_BYTES) {
        return { error: 'El logo no puede superar 2MB.' }
      }

      const bytes = new Uint8Array(await archivo.arrayBuffer())
      const rutaLogo = `${empresaId}/logo.png`

      const { error: uploadError } = await admin.storage.from('logos').upload(rutaLogo, bytes, {
        contentType: archivo.type,
        upsert: true,
      })

      if (uploadError) {
        return { error: normalizarErrorSupabase(uploadError.message) }
      }

      const {
        data: { publicUrl },
      } = admin.storage.from('logos').getPublicUrl(rutaLogo)

      logoUrl = publicUrl
    }

    const payload: {
      precio_wp: number
      tasa_dolar: number
      onboarding_completado: boolean
      logo_url?: string | null
    } = {
      precio_wp: Number.isFinite(precioWp) ? precioWp : PRECIO_WP_DEFAULT,
      tasa_dolar: Number.isFinite(tasaDolar) ? tasaDolar : 54,
      onboarding_completado: true,
    }

    if (logoUrl) {
      payload.logo_url = logoUrl
    }

    const { error } = await admin.from('empresas').update(payload).eq('id', empresaId)

    if (error) {
      return { error: normalizarErrorSupabase(error.message) }
    }

    return { ok: true }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo completar el onboarding.',
    }
  }
}
