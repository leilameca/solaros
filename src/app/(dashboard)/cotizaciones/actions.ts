'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { calcularSistema, calcularLey5707 } from '@/lib/calculos'
import { PRECIO_WP_DEFAULT, TASA_DOLAR_DEFAULT } from '@/lib/constants'
import type { NuevaCotizacionInput, EstadoCotizacion } from '@/types/cotizaciones'

export async function crearCotizacion(input: NuevaCotizacionInput) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) redirect('/login')

  // Obtener configuración de la empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('precio_wp, tasa_dolar')
    .eq('id', empresaId)
    .single()

  const precioWp = empresa?.precio_wp ?? PRECIO_WP_DEFAULT
  const tasaDolar = empresa?.tasa_dolar ?? TASA_DOLAR_DEFAULT

  // Calcular sistema
  const resultado = calcularSistema({
    kwhMensual: input.kwhMensual,
    provincia: input.provincia,
    tarifa: input.tarifa,
    panelW: input.panelPotenciaW,
    precioWp,
    tasaDolar,
  })

  // Calcular Ley 57-07 si aplica
  const ley5707 = input.ley5707Activa
    ? calcularLey5707(resultado.totalUsd, resultado.ahorroAnualUsd)
    : null

  // Generar número de cotización
  const { data: numeroCot } = await supabase
    .rpc('generar_numero_cotizacion', { p_empresa_id: empresaId })

  // Crear o encontrar cliente
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
      const { data: nuevoCliente } = await supabase
        .from('clientes')
        .insert({
          empresa_id: empresaId,
          nombre: input.nombreTitular,
          numero_contrato: input.numeroContrato || null,
          provincia: input.provincia,
        })
        .select('id')
        .single()
      clienteId = nuevoCliente?.id ?? null
    }
  }

  // Insertar cotización
  const { data: cotizacion, error } = await supabase
    .from('cotizaciones')
    .insert({
      empresa_id: empresaId,
      cliente_id: clienteId,
      numero_cotizacion: numeroCot ?? `COT-${Date.now()}`,
      tipo_sistema: input.tipoSistema,
      provincia: input.provincia,
      tarifa: input.tarifa,
      kwh_mensual: input.kwhMensual,
      horas_sol: resultado.horasSol,
      kwp_calculado: resultado.kwpReal,
      generacion_mensual: resultado.generacionMensual,
      generacion_anual: resultado.generacionAnual,
      panel_marca: input.panelMarca || null,
      panel_modelo: input.panelModelo || null,
      panel_potencia_w: input.panelPotenciaW || null,
      panel_cantidad: resultado.cantidadPaneles,
      inversor_marca: input.inversorMarca || null,
      inversor_modelo: input.inversorModelo || null,
      inversor_kw: input.inversorKw || null,
      inversor_cantidad: input.inversorCantidad || null,
      precio_wp: precioWp,
      total_usd: resultado.totalUsd,
      ley_5707_activa: input.ley5707Activa,
      inversion_neta_usd: ley5707?.inversionNetaUsd ?? null,
      retorno_con_ley: ley5707?.retornoConLey ?? null,
      retorno_sin_ley: resultado.retornoSinLey,
      ahorro_mensual_rd: resultado.ahorroMensualRd,
      ahorro_anual_usd: resultado.ahorroAnualUsd,
      tasa_dolar: tasaDolar,
      estado: 'borrador',
      notas: input.notas || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !cotizacion) {
    return { error: error?.message ?? 'Error al crear cotización' }
  }

  // Insertar consumo mensual
  const consumoMensual = resultado.meses.map((mes) => ({
    cotizacion_id: cotizacion.id,
    mes: mes.mes,
    consumo_kwh: mes.consumo,
    generacion_kwh: mes.generacion,
  }))

  await supabase.from('cotizacion_consumo_mensual').insert(consumoMensual)

  revalidatePath('/cotizaciones')
  redirect(`/cotizaciones/${cotizacion.id}`)
}

export async function actualizarEstadoCotizacion(
  cotizacionId: string,
  nuevoEstado: EstadoCotizacion
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('cotizaciones')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', cotizacionId)

  if (error) return { error: error.message }

  revalidatePath(`/cotizaciones/${cotizacionId}`)
  revalidatePath('/cotizaciones')
  return { ok: true }
}

export async function eliminarCotizacion(cotizacionId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('id', cotizacionId)

  if (error) return { error: error.message }

  revalidatePath('/cotizaciones')
  return { ok: true }
}
