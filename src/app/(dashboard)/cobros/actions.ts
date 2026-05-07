'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import {
  MENSAJE_EMPRESA_NO_CONFIGURADA,
  normalizarErrorSupabase,
} from '@/lib/supabase/errores'
import type { RegistrarPagoInput } from '@/types/cobros'

interface CuotaInput {
  orden: number
  porcentaje: number
  monto_usd: number
  monto_rd: number | null
  condicion: string
  fecha_limite?: string | null
}

interface CrearPlanInput {
  cotizacion_id: string
  cotizacion_tipo: 'solar' | 'bombeo' | 'electrico'
  numero_cotizacion: string
  cliente_id: string | null
  cliente_nombre: string
  total_usd: number
  total_rd: number | null
  plan_tipo: string
  notas?: string
  cuotas: CuotaInput[]
}

export async function crearPlanPago(input: CrearPlanInput) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) return { error: MENSAJE_EMPRESA_NO_CONFIGURADA }

  const { data: plan, error: planError } = await supabase
    .from('planes_pago')
    .insert({
      empresa_id: empresaId,
      cotizacion_id: input.cotizacion_id,
      cotizacion_tipo: input.cotizacion_tipo,
      numero_cotizacion: input.numero_cotizacion,
      cliente_id: input.cliente_id,
      cliente_nombre: input.cliente_nombre,
      total_usd: input.total_usd,
      total_rd: input.total_rd,
      plan_tipo: input.plan_tipo,
      notas: input.notas ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (planError || !plan) {
    return { error: normalizarErrorSupabase(planError?.message) }
  }

  const cuotasData = input.cuotas.map((c) => ({
    plan_id: plan.id,
    empresa_id: empresaId,
    orden: c.orden,
    porcentaje: c.porcentaje,
    monto_usd: c.monto_usd,
    monto_rd: c.monto_rd,
    condicion: c.condicion,
    fecha_limite: c.fecha_limite ?? null,
  }))

  const { error: cuotasError } = await supabase.from('plan_pago_cuotas').insert(cuotasData)

  if (cuotasError) {
    await supabase.from('planes_pago').delete().eq('id', plan.id)
    return { error: normalizarErrorSupabase(cuotasError.message) }
  }

  revalidatePath('/cobros')
  redirect(`/cobros/${plan.id}`)
}

export async function registrarPago(input: RegistrarPagoInput) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) return { error: MENSAJE_EMPRESA_NO_CONFIGURADA }

  const { data: cuota, error: cuotaError } = await supabase
    .from('plan_pago_cuotas')
    .select('plan_id')
    .eq('id', input.cuota_id)
    .single()

  if (cuotaError || !cuota) {
    return { error: 'Cuota no encontrada' }
  }

  const { error: updateError } = await supabase
    .from('plan_pago_cuotas')
    .update({
      estado: 'pagado',
      fecha_pago: input.fecha_pago,
      metodo_pago: input.metodo_pago,
      referencia_pago: input.referencia_pago ?? null,
      monto_recibido_usd: input.monto_recibido_usd,
      comprobante_url: input.comprobante_url ?? null,
      notas_pago: input.notas_pago ?? null,
      registrado_por: user.id,
    })
    .eq('id', input.cuota_id)

  if (updateError) {
    return { error: normalizarErrorSupabase(updateError.message) }
  }

  // Si todas las cuotas del plan están pagadas → marcar plan completado
  const { data: pendientes } = await supabase
    .from('plan_pago_cuotas')
    .select('id')
    .eq('plan_id', cuota.plan_id)
    .in('estado', ['pendiente', 'vencido'])

  if (!pendientes || pendientes.length === 0) {
    await supabase
      .from('planes_pago')
      .update({ estado: 'completado' })
      .eq('id', cuota.plan_id)
  }

  revalidatePath(`/cobros/${cuota.plan_id}`)
  revalidatePath('/cobros')
  return { ok: true, planId: cuota.plan_id }
}

export async function cancelarPlan(planId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('planes_pago')
    .update({ estado: 'cancelado' })
    .eq('id', planId)

  if (error) return { error: normalizarErrorSupabase(error.message) }

  revalidatePath(`/cobros/${planId}`)
  revalidatePath('/cobros')
  return { ok: true }
}
