'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import {
  MENSAJE_EMPRESA_NO_CONFIGURADA,
  normalizarErrorSupabase,
} from '@/lib/supabase/errores'
import { verificarLimiteCotizacionesMes } from '@/lib/limites-plan'
import type { EstadoCotizacionBombeo, NuevaCotizacionBombeoInput } from '@/types/bombeo'

const HORAS_BOMBEO_SOLAR = 6

function numeroSeguro(valor: number | null | undefined) {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : 0
}

function calcularResultadoBombeo(input: {
  tipoSistema: NuevaCotizacionBombeoInput['tipoSistema']
  profundidadM: number | null
  caudalM3h: number
  litrosDiaRequeridos: number
  alturaDescargaM: number
  provincia: string
}) {
  const alturaTotal = numeroSeguro(input.profundidadM) + numeroSeguro(input.alturaDescargaM)
  const potenciaHpRaw = (numeroSeguro(input.caudalM3h) * alturaTotal) / (270 * 0.75)
  const potenciaHp = Math.ceil(potenciaHpRaw * 2) / 2
  const potenciaKw = potenciaHp * 0.746
  const litrosDisponibles = numeroSeguro(input.caudalM3h) * 1000 * HORAS_BOMBEO_SOLAR
  const cubre = litrosDisponibles >= numeroSeguro(input.litrosDiaRequeridos)
  const deficit = cubre ? 0 : numeroSeguro(input.litrosDiaRequeridos) - litrosDisponibles
  const kwpNecesario = input.tipoSistema === 'electrico' ? null : potenciaKw / 0.85

  return {
    potenciaHp: Number(potenciaHp.toFixed(1)),
    potenciaKw: Number(potenciaKw.toFixed(3)),
    litrosDisponibles: Number(litrosDisponibles.toFixed(2)),
    cubre,
    deficit,
    kwpNecesario: kwpNecesario ? Number(kwpNecesario.toFixed(3)) : null,
  }
}

export async function crearCotizacionBombeo(input: NuevaCotizacionBombeoInput) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) return { error: MENSAJE_EMPRESA_NO_CONFIGURADA }

  const limitePlan = await verificarLimiteCotizacionesMes(empresaId)
  if (!limitePlan.ok) return { error: limitePlan.error }

  const resultado = calcularResultadoBombeo({
    tipoSistema: input.tipoSistema,
    profundidadM: input.profundidadM,
    caudalM3h: input.caudalM3h,
    litrosDiaRequeridos: input.litrosDiaRequeridos,
    alturaDescargaM: input.alturaDescargaM,
    provincia: input.provincia,
  })

  const totalUsd =
    numeroSeguro(input.bombaPrecio) +
    numeroSeguro(input.instalacionUsd) +
    (input.tipoSistema === 'electrico'
      ? 0
      : numeroSeguro(input.panelPrecioUnit) * numeroSeguro(input.panelCantidad)) +
    (input.tipoSistema === 'solar_vfd' ? numeroSeguro(input.vfdPrecio) : 0)

  const { data: numeroCotizacion, error: numeroCotizacionError } = await supabase.rpc('generar_numero_cotizacion_bombeo', {
    p_empresa_id: empresaId,
  })

  if (numeroCotizacionError) {
    return { error: normalizarErrorSupabase(numeroCotizacionError.message) }
  }

  let clienteId = input.clienteId

  if (!clienteId && input.clienteNombre.trim()) {
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('nombre', input.clienteNombre.trim())
      .maybeSingle()

    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: clienteNuevo, error: clienteNuevoError } = await supabase
        .from('clientes')
        .insert({
          empresa_id: empresaId,
          nombre: input.clienteNombre.trim(),
          provincia: input.tipoSistema === 'electrico' ? null : input.provincia,
        })
        .select('id')
        .single()

      if (clienteNuevoError) {
        return { error: normalizarErrorSupabase(clienteNuevoError.message) }
      }

      clienteId = clienteNuevo?.id ?? null
    }
  }

  const { data: cotizacion, error } = await supabase
    .from('cotizaciones_bombeo')
    .insert({
      empresa_id: empresaId,
      cliente_id: clienteId,
      numero_cotizacion: numeroCotizacion ?? `BOMB-${Date.now()}`,
      tipo_sistema: input.tipoSistema,
      tipo_bomba: input.tipoBomba,
      provincia: input.tipoSistema === 'electrico' ? null : input.provincia,
      profundidad_m: input.tipoBomba === 'sumergible' ? input.profundidadM : null,
      caudal_m3h: input.caudalM3h,
      litros_dia_requeridos: input.litrosDiaRequeridos,
      altura_descarga_m: input.alturaDescargaM,
      potencia_hp: resultado.potenciaHp,
      potencia_kw: resultado.potenciaKw,
      litros_disponibles: resultado.litrosDisponibles,
      kwp_necesario: resultado.kwpNecesario,
      bomba_marca: input.bombaMarca || null,
      bomba_modelo: input.bombaModelo || null,
      bomba_hp: input.bombaHp ?? resultado.potenciaHp,
      bomba_precio: input.bombaPrecio || 0,
      panel_marca: input.tipoSistema === 'electrico' ? null : input.panelMarca,
      panel_modelo: input.tipoSistema === 'electrico' ? null : input.panelModelo,
      panel_w: input.tipoSistema === 'electrico' ? null : input.panelW,
      panel_cantidad: input.tipoSistema === 'electrico' ? null : input.panelCantidad,
      panel_precio_unit: input.tipoSistema === 'electrico' ? null : input.panelPrecioUnit,
      vfd_marca: input.tipoSistema === 'solar_vfd' ? input.vfdMarca : null,
      vfd_modelo: input.tipoSistema === 'solar_vfd' ? input.vfdModelo : null,
      vfd_kw: input.tipoSistema === 'solar_vfd' ? input.vfdKw : null,
      vfd_precio: input.tipoSistema === 'solar_vfd' ? input.vfdPrecio : null,
      instalacion_usd: input.instalacionUsd,
      total_usd: Number(totalUsd.toFixed(2)),
      estado: input.estado,
      notas: input.notas || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !cotizacion) {
    return { error: normalizarErrorSupabase(error?.message) }
  }

  revalidatePath('/bombeo')
  redirect(`/bombeo/${cotizacion.id}`)
}

export async function actualizarEstadoCotizacionBombeo(
  cotizacionId: string,
  nuevoEstado: EstadoCotizacionBombeo
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('cotizaciones_bombeo')
    .update({ estado: nuevoEstado })
    .eq('id', cotizacionId)

  if (error) {
    return { error: normalizarErrorSupabase(error.message) }
  }

  revalidatePath('/bombeo')
  revalidatePath(`/bombeo/${cotizacionId}`)
  return { ok: true }
}
