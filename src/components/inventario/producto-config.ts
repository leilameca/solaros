import type { CategoriaProducto } from '@/types/inventario'

const OPCIONES_CATEGORIA: Array<{ value: CategoriaProducto; label: string }> = [
  { value: 'panel_solar', label: 'Panel solar' },
  { value: 'inversor', label: 'Inversor' },
  { value: 'bateria', label: 'Bateria' },
  { value: 'bomba', label: 'Bomba' },
  { value: 'vfd', label: 'VFD' },
  { value: 'material_electrico', label: 'Material electrico' },
  { value: 'accesorio', label: 'Accesorio' },
  { value: 'otro', label: 'Otro' },
]

type CampoProducto =
  | 'potencia_w'
  | 'potencia_kw'
  | 'potencia_hp'
  | 'voltaje'
  | 'capacidad_kwh'
  | 'unidad'
  | 'precio_rd'

export function createProductConfig(categoria: CategoriaProducto) {
  const campos: CampoProducto[] = []

  if (categoria === 'panel_solar') {
    campos.push('potencia_w', 'voltaje')
  }

  if (categoria === 'inversor') {
    campos.push('potencia_kw', 'voltaje')
  }

  if (categoria === 'bateria') {
    campos.push('capacidad_kwh', 'voltaje')
  }

  if (categoria === 'bomba') {
    campos.push('potencia_hp', 'potencia_kw')
  }

  if (categoria === 'vfd') {
    campos.push('potencia_kw')
  }

  if (categoria === 'material_electrico') {
    campos.push('unidad', 'precio_rd')
  }

  if (categoria === 'accesorio' || categoria === 'otro') {
    campos.push('unidad')
  }

  return {
    opciones: OPCIONES_CATEGORIA,
    campos,
  }
}
