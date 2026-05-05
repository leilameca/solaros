export type TipoSistema = 'on_grid' | 'off_grid' | 'hibrido'
export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'en_instalacion' | 'completada' | 'rechazada'
export type TipoTarifa = 'BTS-1' | 'BTS-2' | 'BTD' | 'BTH' | 'MTD1' | 'MTD2' | 'MTH'

export interface Cotizacion {
  id: string
  empresa_id: string
  cliente_id: string | null
  numero_cotizacion: string
  tipo_sistema: TipoSistema
  provincia: string
  tarifa: TipoTarifa
  kwh_mensual: number
  horas_sol: number
  kwp_calculado: number
  generacion_mensual: number
  generacion_anual: number
  panel_marca: string | null
  panel_modelo: string | null
  panel_potencia_w: number | null
  panel_cantidad: number | null
  inversor_marca: string | null
  inversor_modelo: string | null
  inversor_kw: number | null
  inversor_cantidad: number | null
  precio_wp: number
  total_usd: number
  ley_5707_activa: boolean
  inversion_neta_usd: number | null
  retorno_con_ley: number | null
  retorno_sin_ley: number | null
  ahorro_mensual_rd: number | null
  ahorro_anual_usd: number | null
  tasa_dolar: number
  estado: EstadoCotizacion
  notas: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  clientes?: { nombre: string } | null
}

export interface ConsumoMensual {
  id: string
  cotizacion_id: string
  mes: number
  consumo_kwh: number
  generacion_kwh: number
}

export interface ResultadoCalculo {
  kwp: number
  kwpReal: number
  cantidadPaneles: number
  generacionMensual: number
  generacionAnual: number
  horasSol: number
  meses: MesCalculo[]
  ahorroMensualRd: number
  ahorroAnualRd: number
  ahorroAnualUsd: number
  totalUsd: number
  retornoSinLey: number
}

export interface MesCalculo {
  mes: number
  nombreMes: string
  generacion: number
  consumo: number
}

export interface ResultadoLey5707 {
  descuentoAnualUsd: number
  inversionNetaUsd: number
  retornoConLey: number
  retornoSinLey: number
}

export interface InputCalculo {
  kwhMensual: number
  provincia: string
  tarifa: TipoTarifa
  panelW: number
  precioWp: number
  tasaDolar: number
}

export interface NuevaCotizacionInput {
  clienteId?: string | null
  nombreTitular: string
  numeroContrato: string
  provincia: string
  tarifa: TipoTarifa
  tipoSistema: TipoSistema
  kwhMensual: number
  panelMarca: string
  panelModelo: string
  panelPotenciaW: number
  panelCantidad: number
  inversorMarca: string
  inversorModelo: string
  inversorKw: number
  inversorCantidad: number
  ley5707Activa: boolean
  notas: string
}

export interface EmpresaConfig {
  precio_wp: number
  tasa_dolar: number
  nombre_empresa: string
  logo_url: string | null
}

export interface ItemInventario {
  id: string
  tipo: 'panel' | 'inversor' | 'bateria' | 'otro'
  marca: string
  modelo: string
  potencia_w: number | null
  potencia_kw: number | null
  precio_unitario: number | null
  stock: number
}
