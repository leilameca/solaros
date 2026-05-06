import type { ItemElectricoLocal, TotalesElectrico } from '@/types/electrico'

export const ITBIS_RATE = 0.18

export function calcularItemElectrico(precio_unit_rd: number, cantidad: number) {
  const subtotal = precio_unit_rd * cantidad
  const itbis = subtotal * ITBIS_RATE
  const total = subtotal + itbis
  return { subtotal, itbis, total }
}

export function calcularTotalesElectrico(
  items: ItemElectricoLocal[],
  mano_obra_rd: number,
  tasa_dolar: number
): TotalesElectrico {
  const subtotal_materiales_rd = items.reduce(
    (acc, item) => acc + item.precio_unit_rd * item.cantidad,
    0
  )
  const itbis_rd = subtotal_materiales_rd * ITBIS_RATE
  const total_rd = subtotal_materiales_rd + itbis_rd + mano_obra_rd
  const total_usd = tasa_dolar > 0 ? total_rd / tasa_dolar : 0
  return { subtotal_materiales_rd, itbis_rd, total_rd, total_usd }
}

export function formatearRD2(valor: number): string {
  return valor.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
