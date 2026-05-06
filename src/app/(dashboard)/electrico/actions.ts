'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { calcularTotalesElectrico } from '@/lib/calculos-electrico'
import { TASA_DOLAR_DEFAULT } from '@/lib/constants'
import { verificarLimiteCotizacionesMes } from '@/lib/limites-plan'
import type {
  NuevaCotizacionElectricaInput,
  EstadoCotizacionElectrica,
  NuevoCatalogoMaterialInput,
  CatalogoMaterial,
} from '@/types/electrico'

export async function crearCotizacionElectrica(input: NuevaCotizacionElectricaInput) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) redirect('/login')

  const limitePlan = await verificarLimiteCotizacionesMes(empresaId)
  if (!limitePlan.ok) return { error: limitePlan.error }

  // Obtener tasa_dolar de la empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('tasa_dolar')
    .eq('id', empresaId)
    .single()

  const tasaDolar = empresa?.tasa_dolar ?? TASA_DOLAR_DEFAULT

  // Calcular totales
  const totales = calcularTotalesElectrico(
    input.items.map((i, idx) => ({ ...i, localId: `_${idx}` })),
    input.manoObraRd,
    tasaDolar
  )

  // Generar número de cotización
  const { data: numeroCot } = await supabase.rpc(
    'generar_numero_cotizacion_electrica',
    { p_empresa_id: empresaId }
  )

  // Crear o encontrar cliente
  let clienteId: string | null = input.clienteId ?? null
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
      const { data: nuevoCliente } = await supabase
        .from('clientes')
        .insert({
          empresa_id: empresaId,
          nombre: input.clienteNombre.trim(),
        })
        .select('id')
        .single()
      clienteId = nuevoCliente?.id ?? null
    }
  }

  // Insertar cotización
  const { data: cotizacion, error } = await supabase
    .from('cotizaciones_electricas')
    .insert({
      empresa_id: empresaId,
      cliente_id: clienteId,
      numero_cotizacion: numeroCot ?? `EL-${Date.now()}`,
      tipo_trabajo: input.tipoTrabajo,
      descripcion: input.descripcion || null,
      mano_obra_rd: input.manoObraRd,
      subtotal_materiales_rd: totales.subtotal_materiales_rd,
      itbis_rd: totales.itbis_rd,
      total_rd: totales.total_rd,
      total_usd: totales.total_usd,
      tasa_dolar: tasaDolar,
      estado: input.estado,
      notas: input.notas || null,
      cotizacion_solar_id: input.cotizacionSolarId || null,
      cotizacion_bombeo_id: input.cotizacionBombeoId || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !cotizacion) {
    return { error: error?.message ?? 'Error al crear cotización eléctrica' }
  }

  // Insertar items
  if (input.items.length > 0) {
    const itemsParaInsertar = input.items.map((item, idx) => ({
      cotizacion_id: cotizacion.id,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precio_unit_rd: item.precio_unit_rd,
      orden: item.orden ?? idx,
    }))

    const { error: errorItems } = await supabase
      .from('items_cotizacion_electrica')
      .insert(itemsParaInsertar)

    if (errorItems) {
      return { error: errorItems.message }
    }
  }

  revalidatePath('/electrico')
  redirect(`/electrico/${cotizacion.id}`)
}

export async function actualizarEstadoCotizacionElectrica(
  cotizacionId: string,
  nuevoEstado: EstadoCotizacionElectrica
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('cotizaciones_electricas')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', cotizacionId)

  if (error) return { error: error.message }

  revalidatePath(`/electrico/${cotizacionId}`)
  revalidatePath('/electrico')
  return { ok: true }
}

export async function eliminarCotizacionElectrica(cotizacionId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('cotizaciones_electricas')
    .delete()
    .eq('id', cotizacionId)

  if (error) return { error: error.message }

  revalidatePath('/electrico')
  return { ok: true }
}

export async function guardarMaterialCatalogo(
  input: NuevoCatalogoMaterialInput
): Promise<{ data?: CatalogoMaterial; error?: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) return { error: 'Sin empresa' }

  const { data, error } = await supabase
    .from('catalogo_materiales_electrico')
    .insert({
      empresa_id: empresaId,
      descripcion: input.descripcion.trim(),
      unidad: input.unidad.trim() || 'unidad',
      precio_sugerido_rd: input.precioSugeridoRd,
      categoria: input.categoria.trim() || null,
      activo: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/electrico/catalogo')
  return { data: data as CatalogoMaterial }
}

export async function actualizarMaterialCatalogo(
  id: string,
  input: Partial<NuevoCatalogoMaterialInput>
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const updateData: Record<string, unknown> = {}
  if (input.descripcion !== undefined) updateData.descripcion = input.descripcion.trim()
  if (input.unidad !== undefined) updateData.unidad = input.unidad.trim()
  if (input.precioSugeridoRd !== undefined) updateData.precio_sugerido_rd = input.precioSugeridoRd
  if (input.categoria !== undefined) updateData.categoria = input.categoria.trim() || null

  const { error } = await supabase
    .from('catalogo_materiales_electrico')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/electrico/catalogo')
  return { ok: true }
}

export async function toggleActivoCatalogo(
  id: string,
  activo: boolean
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('catalogo_materiales_electrico')
    .update({ activo })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/electrico/catalogo')
  return { ok: true }
}
