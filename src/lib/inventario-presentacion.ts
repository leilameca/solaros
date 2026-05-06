import type { CategoriaProducto, CategoriaTabInventario, ProductoInventario } from '@/types/inventario'

export const CATEGORIAS_TAB: Array<{
  value: CategoriaTabInventario
  label: string
}> = [
  { value: 'todos', label: 'Todos' },
  { value: 'panel_solar', label: 'Paneles' },
  { value: 'inversor', label: 'Inversores' },
  { value: 'bomba', label: 'Bombas' },
  { value: 'material_electrico', label: 'Electrico' },
  { value: 'otros', label: 'Otros' },
]

export const CATEGORIAS_LABEL: Record<CategoriaProducto, string> = {
  panel_solar: 'Panel solar',
  inversor: 'Inversor',
  bateria: 'Bateria',
  bomba: 'Bomba',
  vfd: 'VFD',
  material_electrico: 'Material electrico',
  accesorio: 'Accesorio',
  otro: 'Otro',
}

function numeroSeguro(valor: number | null | undefined) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
}

export function categoriaPerteneceATab(categoria: CategoriaProducto, tab: CategoriaTabInventario) {
  if (tab === 'todos') return true
  if (tab === 'otros') {
    return ['bateria', 'vfd', 'accesorio', 'otro'].includes(categoria)
  }

  return categoria === tab
}

export function obtenerLabelCategoria(categoria: CategoriaProducto) {
  return CATEGORIAS_LABEL[categoria]
}

export function obtenerEspecificacionProducto(
  producto: Pick<
    ProductoInventario,
    'categoria' | 'potencia_w' | 'potencia_kw' | 'potencia_hp' | 'voltaje' | 'capacidad_kwh' | 'unidad'
  >
) {
  if (producto.categoria === 'panel_solar') {
    return [producto.potencia_w ? `${producto.potencia_w} W` : null, producto.voltaje ? `${producto.voltaje} V` : null]
      .filter(Boolean)
      .join(' · ')
  }

  if (producto.categoria === 'inversor') {
    return [producto.potencia_kw ? `${producto.potencia_kw} kW` : null, producto.voltaje ? `${producto.voltaje} V` : null]
      .filter(Boolean)
      .join(' · ')
  }

  if (producto.categoria === 'bateria') {
    return [producto.capacidad_kwh ? `${producto.capacidad_kwh} kWh` : null, producto.voltaje ? `${producto.voltaje} V` : null]
      .filter(Boolean)
      .join(' · ')
  }

  if (producto.categoria === 'bomba') {
    return [producto.potencia_hp ? `${producto.potencia_hp} HP` : null, producto.potencia_kw ? `${producto.potencia_kw} kW` : null]
      .filter(Boolean)
      .join(' · ')
  }

  if (producto.categoria === 'vfd') {
    return producto.potencia_kw ? `${producto.potencia_kw} kW` : ''
  }

  if (producto.categoria === 'material_electrico') {
    return producto.unidad || 'und'
  }

  return ''
}

export function calcularPorcentajeStock(stockActual: number, stockMinimo: number) {
  const actual = numeroSeguro(stockActual)
  const minimo = Math.max(numeroSeguro(stockMinimo), 1)
  return Math.min(100, Math.max(0, (actual / minimo) * 100))
}

export function formatearFechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatearFechaLarga(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function calcularMargenProducto(precios: {
  precio_costo_usd: number | null
  precio_venta_usd: number | null
}) {
  const costo = numeroSeguro(precios.precio_costo_usd)
  const venta = numeroSeguro(precios.precio_venta_usd)

  if (costo <= 0 || venta <= 0) {
    return null
  }

  return Number((((venta - costo) / costo) * 100).toFixed(1))
}
