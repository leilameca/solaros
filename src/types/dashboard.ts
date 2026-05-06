export type RolDashboard = 'admin' | 'vendedor' | 'tecnico'
export type TipoCotizacionDashboard = 'solar' | 'bombeo' | 'electrico'

export interface UsuarioDashboard {
  id: string
  nombre: string
  email: string
  rol: RolDashboard
}

export interface CotizacionRecienteDashboard {
  tipo: TipoCotizacionDashboard
  tipo_label: 'Solar' | 'Bombeo' | 'Electrico'
  cotizacion_id: string
  numero_cotizacion: string
  cliente_nombre: string
  total_usd: number
  estado: string
  created_at: string
  ruta: string
}

export interface MetricasDashboard {
  cotizacionesEsteMes: number
  clientesNuevos: number
  aprobadasEsteMes: number
  tasaConversion: number
  valorPipelineUsd: number
  valorCerradoMesUsd: number
  proyectosEnInstalacion: number
  stockBajo: number
}

export interface DashboardData {
  usuario: UsuarioDashboard
  saludo: string
  fechaLarga: string
  metricas: MetricasDashboard
  ultimasCotizaciones: CotizacionRecienteDashboard[]
}
