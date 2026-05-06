import { createClient } from '@/lib/supabase/server'
import type {
  CategoriaProducto,
  MetricasInventario,
  MovimientoInventario,
  ProductoInventario,
  ProductoPanelSugerido,
  ProductoStockBajo,
} from '@/types/inventario'

const CAMPOS_PRODUCTO = `
  id,
  empresa_id,
  categoria,
  tipo,
  marca,
  modelo,
  descripcion,
  notas,
  potencia_w,
  potencia_kw,
  potencia_hp,
  voltaje,
  capacidad_kwh,
  stock_actual,
  stock_minimo,
  stock,
  unidad,
  precio_costo_usd,
  precio_venta_usd,
  precio_unitario,
  precio_rd,
  activo,
  created_at,
  updated_at
`

function numeroSeguro(valor: unknown) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  if (typeof valor === 'string' && valor.trim() !== '') {
    const convertido = Number(valor)
    return Number.isFinite(convertido) ? convertido : 0
  }
  return 0
}

function valorNullable(valor: unknown) {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null
  }
  if (typeof valor === 'string') {
    const convertido = Number(valor)
    return Number.isFinite(convertido) ? convertido : null
  }
  return null
}

export function categoriaDesdeLegacyTipo(tipo: string | null | undefined): CategoriaProducto {
  if (tipo === 'panel') return 'panel_solar'
  if (tipo === 'inversor') return 'inversor'
  if (tipo === 'bateria') return 'bateria'
  return 'otro'
}

export function tipoLegacyDesdeCategoria(categoria: CategoriaProducto) {
  if (categoria === 'panel_solar') return 'panel' as const
  if (categoria === 'inversor' || categoria === 'vfd') return 'inversor' as const
  if (categoria === 'bateria') return 'bateria' as const
  return 'otro' as const
}

function normalizarProducto(fila: Record<string, unknown>): ProductoInventario {
  const categoria = (fila.categoria as CategoriaProducto | null) ?? categoriaDesdeLegacyTipo(fila.tipo as string | null)
  const stockActual = numeroSeguro(fila.stock_actual ?? fila.stock)
  const tipoLegacy = (fila.tipo as ProductoInventario['tipo'] | null) ?? tipoLegacyDesdeCategoria(categoria)

  return {
    id: String(fila.id),
    empresa_id: String(fila.empresa_id),
    categoria,
    tipo: tipoLegacy,
    marca: String(fila.marca ?? ''),
    modelo: String(fila.modelo ?? ''),
    descripcion: typeof fila.descripcion === 'string' ? fila.descripcion : null,
    notas: typeof fila.notas === 'string' ? fila.notas : null,
    potencia_w: valorNullable(fila.potencia_w),
    potencia_kw: valorNullable(fila.potencia_kw),
    potencia_hp: valorNullable(fila.potencia_hp),
    voltaje: valorNullable(fila.voltaje),
    capacidad_kwh: valorNullable(fila.capacidad_kwh),
    stock_actual: stockActual,
    stock_minimo: numeroSeguro(fila.stock_minimo ?? 0),
    stock: stockActual,
    unidad: typeof fila.unidad === 'string' && fila.unidad.trim() ? fila.unidad : 'und',
    precio_costo_usd: valorNullable(fila.precio_costo_usd),
    precio_venta_usd: valorNullable(fila.precio_venta_usd ?? fila.precio_unitario),
    precio_unitario: valorNullable(fila.precio_unitario ?? fila.precio_venta_usd),
    precio_rd: valorNullable(fila.precio_rd),
    activo: fila.activo === undefined ? true : Boolean(fila.activo),
    created_at: String(fila.created_at ?? new Date().toISOString()),
    updated_at: String(fila.updated_at ?? new Date().toISOString()),
  }
}

function normalizarMovimiento(fila: Record<string, unknown>): MovimientoInventario {
  const usuarioRaw = fila.usuarios as { nombre?: string; email?: string } | null | undefined

  return {
    id: String(fila.id),
    empresa_id: String(fila.empresa_id),
    producto_id: String(fila.producto_id),
    tipo: String(fila.tipo) as MovimientoInventario['tipo'],
    cantidad: numeroSeguro(fila.cantidad),
    stock_antes: numeroSeguro(fila.stock_antes),
    stock_despues: numeroSeguro(fila.stock_despues),
    motivo: typeof fila.motivo === 'string' ? fila.motivo : null,
    cotizacion_id: typeof fila.cotizacion_id === 'string' ? fila.cotizacion_id : null,
    numero_cotizacion: typeof fila.numero_cotizacion === 'string' ? fila.numero_cotizacion : null,
    precio_unit_usd: valorNullable(fila.precio_unit_usd),
    created_at: String(fila.created_at ?? new Date().toISOString()),
    created_by: typeof fila.created_by === 'string' ? fila.created_by : null,
    usuarios: usuarioRaw
      ? {
          nombre: usuarioRaw.nombre ?? 'Equipo SolarOS',
          email: usuarioRaw.email ?? '',
        }
      : null,
  }
}

export function calcularMargenProducto(producto: Pick<ProductoInventario, 'precio_costo_usd' | 'precio_venta_usd'>) {
  const costo = numeroSeguro(producto.precio_costo_usd)
  const venta = numeroSeguro(producto.precio_venta_usd)

  if (costo <= 0 || venta <= 0) {
    return null
  }

  return Number((((venta - costo) / costo) * 100).toFixed(1))
}

export async function obtenerProductosInventario(params: {
  empresaId: string
  categorias?: CategoriaProducto[]
  busqueda?: string
  soloStockBajo?: boolean
  soloActivos?: boolean
}) {
  const supabase = createClient()

  let query = supabase
    .from('inventario')
    .select(CAMPOS_PRODUCTO)
    .eq('empresa_id', params.empresaId)
    .order('updated_at', { ascending: false })

  if (params.soloActivos !== false) {
    query = query.eq('activo', true)
  }

  if (params.categorias && params.categorias.length > 0) {
    query = query.in('categoria', params.categorias)
  }

  if (params.busqueda?.trim()) {
    const termino = params.busqueda.trim()
    query = query.or(`marca.ilike.%${termino}%,modelo.ilike.%${termino}%`)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  const productos = (data as Record<string, unknown>[]).map(normalizarProducto)

  if (params.soloStockBajo) {
    return productos.filter((producto) => producto.stock_actual <= producto.stock_minimo)
  }

  return productos
}

export async function obtenerProductoInventario(empresaId: string, productoId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select(CAMPOS_PRODUCTO)
    .eq('empresa_id', empresaId)
    .eq('id', productoId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return normalizarProducto(data as Record<string, unknown>)
}

export async function obtenerMovimientosInventario(empresaId: string, productoId: string, pagina = 1, limite = 20) {
  const supabase = createClient()
  const desde = Math.max(0, (pagina - 1) * limite)
  const hasta = desde + limite - 1

  const { data, error, count } = await supabase
    .from('inventario_movimientos')
    .select(
      'id, empresa_id, producto_id, tipo, cantidad, stock_antes, stock_despues, motivo, cotizacion_id, numero_cotizacion, precio_unit_usd, created_at, created_by, usuarios(nombre, email)',
      { count: 'exact' }
    )
    .eq('empresa_id', empresaId)
    .eq('producto_id', productoId)
    .order('created_at', { ascending: false })
    .range(desde, hasta)

  if (error || !data) {
    return {
      movimientos: [] as MovimientoInventario[],
      total: 0,
    }
  }

  return {
    movimientos: (data as Record<string, unknown>[]).map(normalizarMovimiento),
    total: count ?? 0,
  }
}

export async function obtenerProductosStockBajo(empresaId: string) {
  const productos = await obtenerProductosInventario({
    empresaId,
    soloStockBajo: true,
    soloActivos: true,
  })

  return productos.map<ProductoStockBajo>((producto) => ({
    id: producto.id,
    marca: producto.marca,
    modelo: producto.modelo,
    categoria: producto.categoria,
    stock_actual: producto.stock_actual,
    stock_minimo: producto.stock_minimo,
    unidad: producto.unidad,
  }))
}

export async function contarProductosStockBajo(empresaId: string) {
  const productos = await obtenerProductosStockBajo(empresaId)
  return productos.length
}

export async function obtenerMetricasInventario(empresaId: string): Promise<MetricasInventario> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('metricas_inventario', { p_empresa_id: empresaId })

  if (!error && data && Array.isArray(data) && data.length > 0) {
    const row = data[0] as { total_activos: number; stock_bajo: number; valor_total_usd: number }
    return {
      totalProductosActivos: Number(row.total_activos ?? 0),
      productosStockBajo: Number(row.stock_bajo ?? 0),
      valorTotalUsd: Number(row.valor_total_usd ?? 0),
    }
  }

  return { totalProductosActivos: 0, productosStockBajo: 0, valorTotalUsd: 0 }
}

export async function sugerirPaneles(kwp_necesario: number, empresa_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select(CAMPOS_PRODUCTO)
    .eq('empresa_id', empresa_id)
    .eq('categoria', 'panel_solar')
    .eq('activo', true)
    .gt('stock_actual', 0)
    .order('potencia_w', { ascending: false })

  if (error || !data) {
    return [] as ProductoPanelSugerido[]
  }

  return (data as Record<string, unknown>[]).map((fila) => {
    const panel = normalizarProducto(fila)
    const potenciaW = numeroSeguro(panel.potencia_w)

    return {
      ...panel,
      cantidad_sugerida: potenciaW > 0 ? Math.ceil((kwp_necesario * 1000) / potenciaW) : 0,
    }
  })
}

export async function sugerirInversor(kwp_necesario: number, empresa_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select(CAMPOS_PRODUCTO)
    .eq('empresa_id', empresa_id)
    .eq('categoria', 'inversor')
    .eq('activo', true)
    .gt('stock_actual', 0)
    .gte('potencia_kw', kwp_necesario * 0.9)
    .order('potencia_kw', { ascending: true })
    .limit(1)

  if (!error && data?.[0]) {
    return normalizarProducto(data[0] as Record<string, unknown>)
  }

  const { data: fallback } = await supabase
    .from('inventario')
    .select(CAMPOS_PRODUCTO)
    .eq('empresa_id', empresa_id)
    .eq('categoria', 'inversor')
    .eq('activo', true)
    .gt('stock_actual', 0)
    .order('potencia_kw', { ascending: true })
    .limit(1)

  return fallback?.[0] ? normalizarProducto(fallback[0] as Record<string, unknown>) : null
}

export async function sugerirBomba(potencia_hp: number, empresa_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select(CAMPOS_PRODUCTO)
    .eq('empresa_id', empresa_id)
    .eq('categoria', 'bomba')
    .eq('activo', true)
    .gt('stock_actual', 0)
    .gte('potencia_hp', potencia_hp)
    .order('potencia_hp', { ascending: true })
    .limit(1)

  if (!error && data?.[0]) {
    return normalizarProducto(data[0] as Record<string, unknown>)
  }

  const { data: fallback } = await supabase
    .from('inventario')
    .select(CAMPOS_PRODUCTO)
    .eq('empresa_id', empresa_id)
    .eq('categoria', 'bomba')
    .eq('activo', true)
    .gt('stock_actual', 0)
    .order('potencia_hp', { ascending: true })
    .limit(1)

  return fallback?.[0] ? normalizarProducto(fallback[0] as Record<string, unknown>) : null
}
