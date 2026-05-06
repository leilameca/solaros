'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import {
  MENSAJE_EMPRESA_NO_CONFIGURADA,
  normalizarErrorSupabase,
} from '@/lib/supabase/errores'
import { verificarLimiteCotizacionesMes } from '@/lib/limites-plan'
import { calcularSistema, calcularLey5707 } from '@/lib/calculos'
import { PRECIO_WP_DEFAULT, TASA_DOLAR_DEFAULT } from '@/lib/constants'
import type { EstadoCotizacion, NuevaCotizacionInput } from '@/types/cotizaciones'

export async function crearCotizacion(input: NuevaCotizacionInput) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) return { error: MENSAJE_EMPRESA_NO_CONFIGURADA }

  const limitePlan = await verificarLimiteCotizacionesMes(empresaId)
  if (!limitePlan.ok) return { error: limitePlan.error }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('precio_wp, tasa_dolar')
    .eq('id', empresaId)
    .single()

  const precioWp = empresa?.precio_wp ?? PRECIO_WP_DEFAULT
  const tasaDolar = empresa?.tasa_dolar ?? TASA_DOLAR_DEFAULT

  const resultado = calcularSistema({
    kwhMensual: input.kwhMensual,
    provincia: input.provincia,
    tarifa: input.tarifa,
    panelW: input.panelPotenciaW,
    precioWp,
    tasaDolar,
  })

  const ley5707 = input.ley5707Activa
    ? calcularLey5707(resultado.totalUsd, resultado.ahorroAnualUsd)
    : null

  const { data: numeroCot, error: numeroCotError } = await supabase.rpc(
    'generar_numero_cotizacion',
    { p_empresa_id: empresaId }
  )

  if (numeroCotError) {
    return { error: normalizarErrorSupabase(numeroCotError.message) }
  }

  let clienteId: string | null = input.clienteId ?? null

  if (!clienteId && input.nombreTitular) {
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('nombre', input.nombreTitular)
      .maybeSingle()

    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: nuevoCliente, error: nuevoClienteError } = await supabase
        .from('clientes')
        .insert({
          empresa_id: empresaId,
          nombre: input.nombreTitular,
          numero_contrato: input.numeroContrato || null,
          provincia: input.provincia,
        })
        .select('id')
        .single()

      if (nuevoClienteError) {
        return { error: normalizarErrorSupabase(nuevoClienteError.message) }
      }

      clienteId = nuevoCliente?.id ?? null
    }
  }

  const consumoMensual = resultado.meses.map((mes) => ({
    mes: mes.mes,
    consumo_kwh: mes.consumo,
    generacion_kwh: mes.generacion,
  }))

  const { data: cotizacionId, error } = await supabase.rpc(
    'crear_cotizacion_con_consumo',
    {
      p_empresa_id:         empresaId,
      p_cliente_id:         clienteId,
      p_numero_cotizacion:  numeroCot ?? `COT-${Date.now()}`,
      p_tipo_sistema:       input.tipoSistema,
      p_provincia:          input.provincia,
      p_tarifa:             input.tarifa,
      p_kwh_mensual:        input.kwhMensual,
      p_horas_sol:          resultado.horasSol,
      p_kwp_calculado:      resultado.kwpReal,
      p_generacion_mensual: resultado.generacionMensual,
      p_generacion_anual:   resultado.generacionAnual,
      p_panel_marca:        input.panelMarca || null,
      p_panel_modelo:       input.panelModelo || null,
      p_panel_potencia_w:   input.panelPotenciaW || null,
      p_panel_cantidad:     resultado.cantidadPaneles,
      p_inversor_marca:     input.inversorMarca || null,
      p_inversor_modelo:    input.inversorModelo || null,
      p_inversor_kw:        input.inversorKw || null,
      p_inversor_cantidad:  input.inversorCantidad || null,
      p_precio_wp:          precioWp,
      p_total_usd:          resultado.totalUsd,
      p_ley_5707_activa:    input.ley5707Activa,
      p_inversion_neta_usd: ley5707?.inversionNetaUsd ?? null,
      p_retorno_con_ley:    ley5707?.retornoConLey ?? null,
      p_retorno_sin_ley:    resultado.retornoSinLey,
      p_ahorro_mensual_rd:  resultado.ahorroMensualRd,
      p_ahorro_anual_usd:   resultado.ahorroAnualUsd,
      p_tasa_dolar:         tasaDolar,
      p_notas:              input.notas || null,
      p_created_by:         user.id,
      p_consumo_mensual:    consumoMensual,
    }
  )

  if (error || !cotizacionId) {
    return { error: normalizarErrorSupabase(error?.message) }
  }

  revalidatePath('/cotizaciones')
  redirect(`/cotizaciones/${cotizacionId}`)
}

export async function actualizarEstadoCotizacion(
  cotizacionId: string,
  nuevoEstado: EstadoCotizacion
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('cotizaciones')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', cotizacionId)

  if (error) return { error: normalizarErrorSupabase(error.message) }

  revalidatePath(`/cotizaciones/${cotizacionId}`)
  revalidatePath('/cotizaciones')
  return { ok: true }
}

export async function eliminarCotizacion(cotizacionId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('id', cotizacionId)

  if (error) return { error: normalizarErrorSupabase(error.message) }

  revalidatePath('/cotizaciones')
  return { ok: true }
}
