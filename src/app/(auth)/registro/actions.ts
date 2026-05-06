'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sumarMeses, TEXTO_TERMINOS_PDF_SUGERIDO } from '@/lib/configuracion'
import { PLANES_SOLAR_OS } from '@/lib/configuracion'
import { normalizarErrorSupabase } from '@/lib/supabase/errores'

export async function crearEmpresaRegistro(input: {
  nombreEmpresa: string
  rnc?: string
  provincia?: string
  telefono?: string
  emailEmpresa?: string
}) {
  const nombreEmpresa = input.nombreEmpresa.trim()

  if (!nombreEmpresa) {
    return { error: 'El nombre de la empresa es obligatorio.' }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('empresas')
      .insert({
        nombre_empresa: nombreEmpresa,
        rnc: input.rnc?.trim() || null,
        provincia: input.provincia?.trim() || null,
        telefono: input.telefono?.trim() || null,
        email: input.emailEmpresa?.trim() || null,
        color_primario: '#C8860A',
        precio_wp: 0.85,
        tasa_dolar: 54,
        terminos_pdf: TEXTO_TERMINOS_PDF_SUGERIDO,
        plan_actual: 'basico',
        suscripcion_estado: 'trial',
        trial_ends_at: sumarMeses(new Date(), 3).toISOString(),
        suscripcion_monto_usd: PLANES_SOLAR_OS.basico.precioUsd,
        onboarding_completado: false,
      })
      .select('id')
      .single()

    if (error || !data) {
      return { error: normalizarErrorSupabase(error?.message) }
    }

    return { ok: true, empresaId: data.id }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo crear la empresa.',
    }
  }
}
