import type { PlanTipo } from '@/types/cobros'

export interface CuotaDefinicion {
  porcentaje: number
  condicion: string
  orden: number
}

export interface PlanPredefinido {
  id: PlanTipo
  nombre: string
  descripcion: string
  cuotas: CuotaDefinicion[]
}

export const PLANES_PREDEFINIDOS: PlanPredefinido[] = [
  {
    id: '50_50',
    nombre: '50% / 50%',
    descripcion: 'Mitad al inicio, mitad al terminar',
    cuotas: [
      { porcentaje: 50, condicion: 'Al firmar contrato', orden: 1 },
      { porcentaje: 50, condicion: 'Al completar instalación', orden: 2 },
    ],
  },
  {
    id: '25_25_50',
    nombre: '25% / 25% / 50%',
    descripcion: 'Fraccionado en 3 etapas',
    cuotas: [
      { porcentaje: 25, condicion: 'Al firmar contrato', orden: 1 },
      { porcentaje: 25, condicion: 'Al iniciar instalación', orden: 2 },
      { porcentaje: 50, condicion: 'Al completar y probar el sistema', orden: 3 },
    ],
  },
  {
    id: '100_final',
    nombre: '100% al finalizar',
    descripcion: 'Pago total al completar',
    cuotas: [{ porcentaje: 100, condicion: 'Al completar instalación', orden: 1 }],
  },
  {
    id: '100_inicio',
    nombre: '100% por adelantado',
    descripcion: 'Pago total al inicio',
    cuotas: [{ porcentaje: 100, condicion: 'Al firmar contrato', orden: 1 }],
  },
  {
    id: 'personalizado',
    nombre: 'Plan personalizado',
    descripcion: 'Define tus propias cuotas',
    cuotas: [],
  },
]

export function calcularMontoCuota(totalUsd: number, porcentaje: number): number {
  return Math.round((totalUsd * porcentaje) / 100 * 100) / 100
}

export function validarPorcentajes(porcentajes: number[]): boolean {
  const total = porcentajes.reduce((acc, p) => acc + p, 0)
  return Math.abs(total - 100) < 0.01
}

export function formatearMetodoPago(metodo: string): string {
  const map: Record<string, string> = {
    transferencia_bhd: 'Transferencia BHD',
    transferencia_banreservas: 'Transferencia Banreservas',
    transferencia_popular: 'Transferencia Popular',
    efectivo: 'Efectivo',
    cheque: 'Cheque',
    otro: 'Otro',
  }
  return map[metodo] ?? metodo
}

export function diasVencida(fechaLimite: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fechaLimite)
  return Math.floor((hoy.getTime() - limite.getTime()) / (1000 * 60 * 60 * 24))
}

export function diasParaVencer(fechaLimite: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fechaLimite)
  return Math.floor((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}
