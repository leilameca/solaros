'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { obtenerProductoInventario, tipoLegacyDesdeCategoria } from '@/lib/inventario'
import {
  MENSAJE_EMPRESA_NO_CONFIGURADA,
  normalizarErrorSupabase,
} from '@/lib/supabase/errores'
import type {
  MovimientoInventario,
  NuevoMovimientoInventarioInput,
  NuevoProductoInventarioInput,
} from '@/types/inventario'

function numeroSeguro(valor: number | null | undefined) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
}

function limpiarTexto(valor: string | null | undefined) {
  const texto = valor?.trim() ?? ''
  return texto ? texto : null
}

export async function crearProductoInventario(input: NuevoProductoInventarioInput) {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()

  if (!empresaId) return { error: MENSAJE_EMPRESA_NO_CONFIGURADA }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const marca = input.marca.trim()
  const modelo = input.modelo.trim()

  if (!marca || !modelo) {
    return { error: 'Marca y modelo son obligatorios.' }
  }

  const stockInicial = Math.max(0, Math.trunc(numeroSeguro(input.stock_inicial)))
  const stockMinimo = Math.max(0, Math.trunc(numeroSeguro(input.stock_minimo)))
  const precioVenta =
    input.precio_venta_usd ??
    input.precio_costo_usd ??
    null

  const { data: producto, error } = await supabase
    .from('inventario')
    .insert({
      empresa_id: empresaId,
      categoria: input.categoria,
      tipo: tipoLegacyDesdeCategoria(input.categoria),
      marca,
      modelo,
      descripcion: limpiarTexto(input.descripcion),
      notas: limpiarTexto(input.descripcion),
      potencia_w: input.potencia_w,
      potencia_kw: input.potencia_kw,
      potencia_hp: input.potencia_hp,
      voltaje: input.voltaje,
      capacidad_kwh: input.capacidad_kwh,
      stock_actual: stockInicial,
      stock: stockInicial,
      stock_minimo: stockMinimo,
      unidad: limpiarTexto(input.unidad) ?? 'und',
      precio_costo_usd: input.precio_costo_usd,
      precio_venta_usd: precioVenta,
      precio_unitario: precioVenta,
      precio_rd: input.precio_rd,
      activo: true,
    })
    .select('id')
    .single()

  if (error || !producto) {
    return { error: normalizarErrorSupabase(error?.message) }
  }

  revalidatePath('/inventario')
  revalidatePath('/dashboard')
  revalidatePath('/cotizaciones/nueva')
  revalidatePath('/bombeo/nueva')
  redirect(`/inventario/${producto.id}`)
}

export async function registrarMovimientoInventario(input: NuevoMovimientoInventarioInput) {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()

  if (!empresaId) return { error: MENSAJE_EMPRESA_NO_CONFIGURADA }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  const producto = await obtenerProductoInventario(empresaId, input.producto_id)

  if (!producto) {
    return { error: 'No encontramos este producto en tu inventario.' }
  }

  const cantidadBase = Math.trunc(numeroSeguro(input.cantidad))

  if (cantidadBase <= 0 && input.tipo !== 'ajuste') {
    return { error: 'La cantidad debe ser mayor que cero.' }
  }

  const cantidadMovimiento =
    input.tipo === 'ajuste' ? cantidadBase : Math.abs(cantidadBase)

  const delta =
    input.tipo === 'entrada'
      ? cantidadMovimiento
      : input.tipo === 'salida'
        ? cantidadMovimiento * -1
        : cantidadMovimiento

  const stockAntes = producto.stock_actual
  const stockDespues = stockAntes + delta

  if (stockDespues < 0) {
    return { error: 'No hay stock suficiente para registrar esa salida.' }
  }

  const { data: movimiento, error } = await supabase
    .from('inventario_movimientos')
    .insert({
      empresa_id: empresaId,
      producto_id: input.producto_id,
      tipo: input.tipo,
      cantidad: cantidadMovimiento,
      stock_antes: stockAntes,
      stock_despues: stockDespues,
      motivo: limpiarTexto(input.motivo),
      numero_cotizacion: limpiarTexto(input.numero_cotizacion),
      precio_unit_usd:
        producto.precio_costo_usd ??
        producto.precio_venta_usd ??
        producto.precio_unitario,
      created_by: user.id,
    })
    .select(
      'id, empresa_id, producto_id, tipo, cantidad, stock_antes, stock_despues, motivo, cotizacion_id, numero_cotizacion, precio_unit_usd, created_at, created_by, usuarios(nombre, email)'
    )
    .single()

  if (error || !movimiento) {
    return { error: normalizarErrorSupabase(error?.message) }
  }

  const usuarioMovimiento = Array.isArray(movimiento.usuarios)
    ? movimiento.usuarios[0]
    : movimiento.usuarios

  const movimientoNormalizado: MovimientoInventario = {
    ...(movimiento as Omit<MovimientoInventario, 'usuarios'>),
    usuarios: usuarioMovimiento
      ? {
          nombre: usuarioMovimiento.nombre ?? 'Equipo SolarOS',
          email: usuarioMovimiento.email ?? '',
        }
      : null,
  }

  revalidatePath('/inventario')
  revalidatePath(`/inventario/${input.producto_id}`)
  revalidatePath('/dashboard')
  revalidatePath('/cotizaciones/nueva')
  revalidatePath('/bombeo/nueva')

  return {
    ok: true,
    stock_actual: stockDespues,
    movimiento: movimientoNormalizado,
  }
}
