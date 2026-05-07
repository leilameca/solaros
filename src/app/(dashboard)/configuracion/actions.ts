'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  capitalizarPlan,
  LIMITE_USUARIOS,
  PLANES_SOLAR_OS,
  sumarMeses,
  TEXTO_TERMINOS_PDF_SUGERIDO,
} from '@/lib/configuracion'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarErrorSupabase } from '@/lib/supabase/errores'
import { createClient } from '@/lib/supabase/server'
import { PRECIO_WP_DEFAULT } from '@/lib/constants'
import type {
  ActualizarUsuarioEmpresaInput,
  GuardarEmpresaInput,
  GuardarOperativoInput,
  InvitarUsuarioEmpresaInput,
  PlanSuscripcionEmpresa,
  ResultadoAccionConfiguracion,
  RolUsuarioEmpresa,
} from '@/types/configuracion'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const TIPOS_LOGO_PERMITIDOS = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

interface UsuarioContexto {
  id: string
  empresa_id: string | null
  nombre: string
  email: string
  rol: RolUsuarioEmpresa
  cargo: string | null
  activo: boolean
}

function limpiarTexto(valor: string | null | undefined) {
  return valor?.trim() ?? ''
}

function valorNullable(valor: string | null | undefined) {
  const limpio = limpiarTexto(valor)
  return limpio ? limpio : null
}

function esRolUsuario(valor: string | null | undefined): valor is RolUsuarioEmpresa {
  return valor === 'admin' || valor === 'vendedor' || valor === 'tecnico'
}

async function obtenerContextoConfiguracion() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, empresa_id, nombre, email, rol, cargo, activo')
    .eq('id', user.id)
    .maybeSingle()

  const usuarioActual: UsuarioContexto = {
    id: user.id,
    empresa_id: usuario?.empresa_id ?? null,
    nombre:
      limpiarTexto(usuario?.nombre) ||
      (typeof user.user_metadata?.nombre === 'string' ? user.user_metadata.nombre : '') ||
      user.email?.split('@')[0] ||
      'Admin',
    email: limpiarTexto(usuario?.email) || user.email || '',
    rol: esRolUsuario(usuario?.rol) ? usuario.rol : 'admin',
    cargo: usuario?.cargo ?? null,
    activo: usuario?.activo ?? true,
  }

  return { supabase, user, usuarioActual }
}

function obtenerLimiteUsuarios(plan: PlanSuscripcionEmpresa) {
  return LIMITE_USUARIOS[plan] ?? LIMITE_USUARIOS.pro
}

async function validarAdminConEmpresa() {
  const { user, usuarioActual } = await obtenerContextoConfiguracion()

  if (!usuarioActual.empresa_id) {
    return {
      user,
      usuarioActual,
      error: 'Primero completa la configuracion inicial de tu empresa.',
    }
  }

  if (usuarioActual.rol !== 'admin') {
    return {
      user,
      usuarioActual,
      error: 'Solo el administrador puede cambiar esta configuracion.',
    }
  }

  return { user, usuarioActual, error: null }
}

function revalidarConfiguracion() {
  revalidatePath('/configuracion')
  revalidatePath('/dashboard')
  revalidatePath('/inventario')
  revalidatePath('/cotizaciones')
  revalidatePath('/bombeo')
  revalidatePath('/electrico')
}

export async function guardarDatosEmpresa(
  input: GuardarEmpresaInput
): Promise<ResultadoAccionConfiguracion> {
  const nombre = limpiarTexto(input.nombre)
  const telefono = limpiarTexto(input.telefono)

  if (!nombre) {
    return { error: 'El nombre de la empresa es obligatorio.' }
  }

  if (!telefono) {
    return { error: 'El telefono es obligatorio.' }
  }

  try {
    const { user, usuarioActual } = await obtenerContextoConfiguracion()
    const admin = createAdminClient()

    const payloadEmpresa = {
      nombre_empresa: nombre,
      rnc: valorNullable(input.rnc),
      telefono,
      email: valorNullable(input.email) ?? user.email ?? null,
      direccion: valorNullable(input.direccion),
      provincia: valorNullable(input.provincia),
      representante: valorNullable(input.representante),
      cargo_representante: valorNullable(input.cargo_representante),
    }

    if (!usuarioActual.empresa_id) {
      const { data: empresaCreada, error: empresaError } = await admin
        .from('empresas')
        .insert({
          ...payloadEmpresa,
          color_primario: '#C8860A',
          precio_wp: PRECIO_WP_DEFAULT,
          tasa_dolar: 54,
          terminos_pdf: TEXTO_TERMINOS_PDF_SUGERIDO,
          plan_actual: 'basico',
          suscripcion_estado: 'trial',
          trial_ends_at: sumarMeses(new Date(), 3).toISOString(),
          suscripcion_monto_usd: PLANES_SOLAR_OS.basico.precioUsd,
        })
        .select('id')
        .single()

      if (empresaError || !empresaCreada) {
        return { error: normalizarErrorSupabase(empresaError?.message) }
      }

      const { error: usuarioError } = await admin.from('usuarios').upsert({
        id: user.id,
        empresa_id: empresaCreada.id,
        nombre: usuarioActual.nombre,
        email: usuarioActual.email || user.email || '',
        rol: 'admin',
        cargo: usuarioActual.cargo,
        activo: true,
      })

      if (usuarioError) {
        return { error: normalizarErrorSupabase(usuarioError.message) }
      }

      revalidarConfiguracion()
      return {
        ok: true,
        message: 'Empresa creada correctamente. Ya puedes terminar tu configuracion.',
      }
    }

    if (usuarioActual.rol !== 'admin') {
      return { error: 'Solo el administrador puede cambiar esta configuracion.' }
    }

    const { error } = await admin
      .from('empresas')
      .update(payloadEmpresa)
      .eq('id', usuarioActual.empresa_id)

    if (error) {
      return { error: normalizarErrorSupabase(error.message) }
    }

    revalidarConfiguracion()
    return { ok: true, message: 'Datos actualizados correctamente.' }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo guardar la empresa.',
    }
  }
}

export async function guardarConfigOperativa(
  input: GuardarOperativoInput
): Promise<ResultadoAccionConfiguracion> {
  try {
    const { usuarioActual, error } = await validarAdminConEmpresa()

    if (error || !usuarioActual.empresa_id) {
      return { error: error ?? 'Empresa no disponible.' }
    }

    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('empresas')
      .update({
        precio_wp: Number(input.precio_wp || 0),
        tasa_dolar: Number(input.tasa_dolar || 0),
        terminos_pdf: limpiarTexto(input.terminos_pdf).slice(0, 800) || null,
      })
      .eq('id', usuarioActual.empresa_id)

    if (updateError) {
      return { error: normalizarErrorSupabase(updateError.message) }
    }

    revalidarConfiguracion()
    return { ok: true, message: 'Configuracion operativa actualizada.' }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo guardar la configuracion operativa.',
    }
  }
}

export async function guardarAparienciaEmpresa(formData: FormData) {
  try {
    const { usuarioActual, error } = await validarAdminConEmpresa()

    if (error || !usuarioActual.empresa_id) {
      return { error: error ?? 'Empresa no disponible.' }
    }

    const colorPrimario = limpiarTexto(String(formData.get('color_primario') ?? '')) || '#C8860A'
    const logoActual = valorNullable(String(formData.get('logo_url_actual') ?? ''))
    const archivo = formData.get('logo')
    const admin = createAdminClient()

    let logoUrl = logoActual

    if (archivo instanceof File && archivo.size > 0) {
      if (!TIPOS_LOGO_PERMITIDOS.has(archivo.type)) {
        return { error: 'El logo debe ser PNG, JPG o WebP.' }
      }

      if (archivo.size > MAX_LOGO_BYTES) {
        return { error: 'El logo no puede superar 2MB.' }
      }

      const bytes = new Uint8Array(await archivo.arrayBuffer())
      const rutaLogo = `${usuarioActual.empresa_id}/logo.png`

      const { error: uploadError } = await admin.storage
        .from('logos')
        .upload(rutaLogo, bytes, {
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

    const { error: updateError } = await admin
      .from('empresas')
      .update({
        color_primario: colorPrimario,
        logo_url: logoUrl,
      })
      .eq('id', usuarioActual.empresa_id)

    if (updateError) {
      return { error: normalizarErrorSupabase(updateError.message) }
    }

    revalidarConfiguracion()
    return {
      ok: true,
      message: archivo instanceof File && archivo.size > 0 ? 'Logo actualizado.' : 'Apariencia actualizada.',
      logo_url: logoUrl,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo guardar la apariencia.',
    }
  }
}

export async function actualizarUsuarioEmpresa(
  input: ActualizarUsuarioEmpresaInput
): Promise<ResultadoAccionConfiguracion> {
  try {
    const { usuarioActual, error } = await validarAdminConEmpresa()

    if (error || !usuarioActual.empresa_id) {
      return { error: error ?? 'Empresa no disponible.' }
    }

    if (input.usuarioId === usuarioActual.id && input.activo === false) {
      return { error: 'No puedes desactivarte a ti mismo.' }
    }

    const admin = createAdminClient()

    const { data: empresa } = await admin
      .from('empresas')
      .select('plan_actual')
      .eq('id', usuarioActual.empresa_id)
      .single()

    const planActual = (empresa?.plan_actual ?? 'pro') as PlanSuscripcionEmpresa
    const limiteUsuarios = obtenerLimiteUsuarios(planActual)

    const { data: usuarioObjetivo } = await admin
      .from('usuarios')
      .select('activo')
      .eq('id', input.usuarioId)
      .eq('empresa_id', usuarioActual.empresa_id)
      .maybeSingle()

    if (input.activo === true && usuarioObjetivo?.activo === false && Number.isFinite(limiteUsuarios)) {
      const { count } = await admin
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', usuarioActual.empresa_id)
        .eq('activo', true)

      if ((count ?? 0) >= limiteUsuarios) {
        return {
          error: `Has alcanzado el limite de ${limiteUsuarios} usuarios de tu plan.`,
        }
      }
    }

    const payload: {
      rol?: RolUsuarioEmpresa
      cargo?: string | null
      activo?: boolean
    } = {}

    if (input.rol) payload.rol = input.rol
    if (input.cargo !== undefined) payload.cargo = valorNullable(input.cargo)
    if (input.activo !== undefined) payload.activo = input.activo

    const { error: updateError } = await admin
      .from('usuarios')
      .update(payload)
      .eq('id', input.usuarioId)
      .eq('empresa_id', usuarioActual.empresa_id)

    if (updateError) {
      return { error: normalizarErrorSupabase(updateError.message) }
    }

    revalidarConfiguracion()
    return { ok: true, message: 'Usuario actualizado.' }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo actualizar el usuario.',
    }
  }
}

export async function invitarUsuarioEmpresa(
  input: InvitarUsuarioEmpresaInput
): Promise<ResultadoAccionConfiguracion> {
  const nombre = limpiarTexto(input.nombre)
  const email = limpiarTexto(input.email).toLowerCase()

  if (!nombre) {
    return { error: 'El nombre es obligatorio.' }
  }

  if (!email) {
    return { error: 'El email es obligatorio.' }
  }

  try {
    const { usuarioActual, error } = await validarAdminConEmpresa()

    if (error || !usuarioActual.empresa_id) {
      return { error: error ?? 'Empresa no disponible.' }
    }

    const admin = createAdminClient()

    const { data: empresa } = await admin
      .from('empresas')
      .select('plan_actual')
      .eq('id', usuarioActual.empresa_id)
      .single()

    const planActual = (empresa?.plan_actual ?? 'pro') as PlanSuscripcionEmpresa
    const limiteUsuarios = obtenerLimiteUsuarios(planActual)

    if (Number.isFinite(limiteUsuarios)) {
      const { count } = await admin
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', usuarioActual.empresa_id)
        .eq('activo', true)

      if ((count ?? 0) >= limiteUsuarios) {
        return {
          error: `Has alcanzado el limite de ${limiteUsuarios} usuarios de tu plan. Actualiza para agregar mas miembros.`,
        }
      }
    }

    const { data: invitacion, error: invitacionError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          empresa_id: usuarioActual.empresa_id,
          nombre,
          rol: input.rol,
          cargo: limpiarTexto(input.cargo),
        },
      }
    )

    if (invitacionError) {
      return { error: normalizarErrorSupabase(invitacionError.message) }
    }

    if (invitacion.user?.id) {
      const { error: usuarioError } = await admin.from('usuarios').upsert({
        id: invitacion.user.id,
        empresa_id: usuarioActual.empresa_id,
        nombre,
        email,
        rol: input.rol,
        cargo: valorNullable(input.cargo),
        activo: true,
      })

      if (usuarioError) {
        return { error: normalizarErrorSupabase(usuarioError.message) }
      }
    }

    revalidarConfiguracion()
    return { ok: true, message: 'Invitacion enviada correctamente.' }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo enviar la invitacion.',
    }
  }
}

export async function cambiarPlanSuscripcionEmpresa(input: {
  plan_actual: PlanSuscripcionEmpresa
}): Promise<
  ResultadoAccionConfiguracion & {
    plan_actual?: PlanSuscripcionEmpresa
    suscripcion_monto_usd?: number
  }
> {
  try {
    const { usuarioActual, error } = await validarAdminConEmpresa()

    if (error || !usuarioActual.empresa_id) {
      return { error: error ?? 'Empresa no disponible.' }
    }

    const planObjetivo = input.plan_actual
    const datosPlan = PLANES_SOLAR_OS[planObjetivo]

    if (!datosPlan) {
      return { error: 'El plan seleccionado no es valido.' }
    }

    const admin = createAdminClient()
    const { data: empresaActual } = await admin
      .from('empresas')
      .select('plan_actual, suscripcion_estado')
      .eq('id', usuarioActual.empresa_id)
      .maybeSingle()

    if (empresaActual?.plan_actual === planObjetivo) {
      return {
        ok: true,
        message: `Ya estas en el plan ${capitalizarPlan(planObjetivo)}.`,
        plan_actual: planObjetivo,
        suscripcion_monto_usd: datosPlan.precioUsd,
      }
    }

    const { error: updateError } = await admin
      .from('empresas')
      .update({
        plan_actual: planObjetivo,
        suscripcion_monto_usd: datosPlan.precioUsd,
      })
      .eq('id', usuarioActual.empresa_id)

    if (updateError) {
      return { error: normalizarErrorSupabase(updateError.message) }
    }

    revalidarConfiguracion()

    return {
      ok: true,
      message:
        empresaActual?.suscripcion_estado === 'trial'
          ? `Plan cambiado a ${capitalizarPlan(planObjetivo)}. Tu prueba gratuita sigue activa.`
          : `Plan actualizado a ${capitalizarPlan(planObjetivo)}.`,
      plan_actual: planObjetivo,
      suscripcion_monto_usd: datosPlan.precioUsd,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? normalizarErrorSupabase(error.message)
          : 'No se pudo cambiar el plan de la empresa.',
    }
  }
}
