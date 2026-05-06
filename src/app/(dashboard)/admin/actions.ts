'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUPERADMIN_EMAIL } from '@/lib/permisos'
import { createClient } from '@/lib/supabase/server'
import { normalizarErrorSupabase } from '@/lib/supabase/errores'
import type { EstadoSuscripcionEmpresa, PlanSuscripcionEmpresa } from '@/types/configuracion'

async function validarSuperadmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || (user.email ?? '').toLowerCase() !== SUPERADMIN_EMAIL.toLowerCase()) {
    return { error: 'Solo superadmin puede realizar esta accion.' }
  }

  return { error: null }
}

export async function actualizarEmpresaAdmin(input: {
  empresaId: string
  plan_actual?: PlanSuscripcionEmpresa
  suscripcion_estado?: EstadoSuscripcionEmpresa | 'suspendida'
}) {
  const validacion = await validarSuperadmin()

  if (validacion.error) {
    return { error: validacion.error }
  }

  try {
    const admin = createAdminClient()
    const payload: {
      plan_actual?: PlanSuscripcionEmpresa
      suscripcion_estado?: EstadoSuscripcionEmpresa | 'suspendida'
    } = {}

    if (input.plan_actual) payload.plan_actual = input.plan_actual
    if (input.suscripcion_estado) payload.suscripcion_estado = input.suscripcion_estado

    const { error } = await admin.from('empresas').update(payload).eq('id', input.empresaId)

    if (error) {
      return { error: normalizarErrorSupabase(error.message) }
    }

    revalidatePath('/admin')
    revalidatePath('/configuracion')
    return { ok: true }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo actualizar la empresa.',
    }
  }
}
