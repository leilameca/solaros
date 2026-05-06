export type CategoriaProducto =
  | 'panel_solar'
  | 'inversor'
  | 'bateria'
  | 'bomba'
  | 'vfd'
  | 'material_electrico'
  | 'accesorio'
  | 'otro'

export type TipoMovimientoInventario = 'entrada' | 'salida' | 'ajuste'

export type CategoriaTabInventario =
  | 'todos'
  | 'panel_solar'
  | 'inversor'
  | 'bomba'
  | 'material_electrico'
  | 'otros'

export interface ProductoInventario {
  id: string
  empresa_id: string
  categoria: CategoriaProducto
  tipo: 'panel' | 'inversor' | 'bateria' | 'otro'
  marca: string
  modelo: string
  descripcion: string | null
  notas: string | null
  potencia_w: number | null
  potencia_kw: number | null
  potencia_hp: number | null
  voltaje: number | null
  capacidad_kwh: number | null
  stock_actual: number
  stock_minimo: number
  stock: number
  unidad: string
  precio_costo_usd: number | null
  precio_venta_usd: number | null
  precio_unitario: number | null
  precio_rd: number | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ProductoStockBajo {
  id: string
  marca: string
  modelo: string
  categoria: CategoriaProducto
  stock_actual: number
  stock_minimo: number
  unidad: string
}

export interface MovimientoInventario {
  id: string
  empresa_id: string
  producto_id: string
  tipo: TipoMovimientoInventario
  cantidad: number
  stock_antes: number
  stock_despues: number
  motivo: string | null
  cotizacion_id: string | null
  numero_cotizacion: string | null
  precio_unit_usd: number | null
  created_at: string
  created_by: string | null
  usuarios?: {
    nombre: string
    email: string
  } | null
}

export interface NuevoProductoInventarioInput {
  categoria: CategoriaProducto
  marca: string
  modelo: string
  descripcion: string
  potencia_w: number | null
  potencia_kw: number | null
  potencia_hp: number | null
  voltaje: number | null
  capacidad_kwh: number | null
  stock_inicial: number
  stock_minimo: number
  unidad: string
  precio_costo_usd: number | null
  precio_venta_usd: number | null
  precio_rd: number | null
}

export interface NuevoMovimientoInventarioInput {
  producto_id: string
  tipo: TipoMovimientoInventario
  cantidad: number
  motivo: string
  numero_cotizacion?: string | null
}

export interface ProductoPanelSugerido extends ProductoInventario {
  cantidad_sugerida: number
}

export interface MetricasInventario {
  totalProductosActivos: number
  productosStockBajo: number
  valorTotalUsd: number
}
