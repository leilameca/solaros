import {
  HORAS_SOL,
  HORAS_SOL_DEFAULT,
  TARIFAS,
  DEGRADACION_MENSUAL,
  NOMBRES_MESES,
  LOSS_FACTOR,
  DEGRADACION_ANUAL,
  DESCUENTO_LEY5707,
  ANOS_LEY5707,
} from './constants'
import type {
  InputCalculo,
  ResultadoCalculo,
  ResultadoLey5707,
  TipoTarifa,
} from '@/types/cotizaciones'

export function obtenerHorasSol(provincia: string): number {
  return HORAS_SOL[provincia] ?? HORAS_SOL_DEFAULT
}

export function calcularSistema(input: InputCalculo): ResultadoCalculo {
  const { kwhMensual, provincia, tarifa, panelW, precioWp, tasaDolar } = input

  const horasSol = obtenerHorasSol(provincia)

  // KWp teórico necesario
  const kwp = kwhMensual / (horasSol * 30 * (1 - LOSS_FACTOR))

  // Paneles redondeados hacia arriba
  const cantidadPaneles = Math.ceil((kwp * 1000) / panelW)

  // KWp real basado en cantidad exacta de paneles
  const kwpReal = (cantidadPaneles * panelW) / 1000

  // Generación mensual base (sin degradación estacional)
  const generacionMensual = kwpReal * horasSol * 30 * (1 - DEGRADACION_ANUAL)

  const generacionAnual = generacionMensual * 12

  // Datos mensuales con degradación estacional
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const degradacion = DEGRADACION_MENSUAL[mes] ?? 0
    return {
      mes,
      nombreMes: NOMBRES_MESES[i],
      generacion: parseFloat((generacionMensual * (1 - degradacion)).toFixed(2)),
      consumo: kwhMensual,
    }
  })

  // Financiero
  const tarifaKwh = TARIFAS[tarifa as TipoTarifa] ?? 0
  const ahorroMensualRd = generacionMensual * tarifaKwh
  const ahorroAnualRd = ahorroMensualRd * 12
  const ahorroAnualUsd = ahorroAnualRd / tasaDolar

  const totalUsd = kwpReal * 1000 * precioWp

  const retornoSinLey = totalUsd / ahorroAnualUsd

  return {
    kwp: parseFloat(kwp.toFixed(2)),
    kwpReal: parseFloat(kwpReal.toFixed(2)),
    cantidadPaneles,
    generacionMensual: parseFloat(generacionMensual.toFixed(2)),
    generacionAnual: parseFloat(generacionAnual.toFixed(2)),
    horasSol,
    meses,
    ahorroMensualRd: parseFloat(ahorroMensualRd.toFixed(2)),
    ahorroAnualRd: parseFloat(ahorroAnualRd.toFixed(2)),
    ahorroAnualUsd: parseFloat(ahorroAnualUsd.toFixed(2)),
    totalUsd: parseFloat(totalUsd.toFixed(2)),
    retornoSinLey: parseFloat(retornoSinLey.toFixed(1)),
  }
}

export function calcularLey5707(
  totalUsd: number,
  ahorroAnualUsd: number
): ResultadoLey5707 {
  const descuentoTotal = totalUsd * DESCUENTO_LEY5707
  const descuentoAnualUsd = descuentoTotal / ANOS_LEY5707
  const inversionNetaUsd = totalUsd - descuentoTotal
  const retornoConLey = inversionNetaUsd / ahorroAnualUsd
  const retornoSinLey = totalUsd / ahorroAnualUsd

  return {
    descuentoAnualUsd: parseFloat(descuentoAnualUsd.toFixed(2)),
    inversionNetaUsd: parseFloat(inversionNetaUsd.toFixed(2)),
    retornoConLey: parseFloat(retornoConLey.toFixed(1)),
    retornoSinLey: parseFloat(retornoSinLey.toFixed(1)),
  }
}

export function formatearUSD(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatearRD(valor: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatearNumero(valor: number, decimales = 2): string {
  return new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor)
}
