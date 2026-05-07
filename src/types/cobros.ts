export type PlanTipo = '50_50' | '25_25_50' | '100_final' | '100_inicio' | 'personalizado'
export type EstadoCuota = 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
export type EstadoPlan = 'activo' | 'completado' | 'cancelado'
export type MetodoPago =
  | 'transferencia_bhd'
  | 'transferencia_banreservas'
  | 'transferencia_popular'
  | 'efectivo'
  | 'cheque'
  | 'otro'

export interface CuotaPago {
  id: string
  plan_id: string
  empresa_id: string
  orden: number
  porcentaje: number
  monto_usd: number
  monto_rd: number | null
  condicion: string
  fecha_limite: string | null
  estado: EstadoCuota
  fecha_pago: string | null
  metodo_pago: string | null
  referencia_pago: string | null
  monto_recibido_usd: number | null
  comprobante_url: string | null
  notas_pago: string | null
  registrado_por: string | null
  created_at: string
  updated_at: string
}

export interface PlanPago {
  id: string
  empresa_id: string
  cotizacion_id: string
  cotizacion_tipo: 'solar' | 'bombeo' | 'electrico'
  numero_cotizacion: string
  cliente_id: string | null
  cliente_nombre: string
  total_usd: number
  total_rd: number | null
  moneda: 'USD' | 'RD'
  plan_tipo: PlanTipo
  estado: EstadoPlan
  notas: string | null
  plan_pago_cuotas: CuotaPago[]
  created_at: string
  updated_at: string
}

export interface RegistrarPagoInput {
  cuota_id: string
  fecha_pago: string
  metodo_pago: MetodoPago
  referencia_pago?: string
  monto_recibido_usd: number
  comprobante_url?: string
  notas_pago?: string
}

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  transferencia_bhd: 'Transferencia BHD',
  transferencia_banreservas: 'Transferencia Banreservas',
  transferencia_popular: 'Transferencia Popular',
  efectivo: 'Efectivo',
  cheque: 'Cheque',
  otro: 'Otro',
}

export const ETIQUETAS_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
}
