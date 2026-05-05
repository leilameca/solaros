export type TipoSistemaBombeo = 'solar_directo' | 'solar_vfd' | 'electrico'

export type TipoBomba = 'sumergible' | 'superficial'

export type EstadoCotizacionBombeo =
  | 'borrador'
  | 'enviada'
  | 'aprobada'
  | 'en_instalacion'
  | 'completada'
  | 'rechazada'

export interface DatosBombeo {
  tipo_sistema: TipoSistemaBombeo
  tipo_bomba: TipoBomba
  provincia?: string
  profundidad_m?: number
  caudal_m3h: number
  litros_dia_requeridos: number
  altura_descarga_m: number
}

export interface ResultadoCalculoBombeo {
  potencia_hp: number
  potencia_kw: number
  litros_disponibles: number
  cubre_requerimiento: boolean
  deficit_litros: number
  kwp_necesario?: number
}

export interface ClienteBombeo {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  numero_contrato: string | null
  provincia: string | null
}

export interface ItemInventarioBombeo {
  id: string
  tipo: 'panel' | 'inversor' | 'bateria' | 'otro'
  marca: string
  modelo: string
  potencia_w: number | null
  potencia_kw: number | null
  precio_unitario: number | null
  stock: number
  notas: string | null
}

export interface EmpresaConfigBombeo {
  nombre_empresa: string
  tasa_dolar: number
  logo_url: string | null
  email?: string | null
  telefono?: string | null
}

export interface CotizacionBombeo {
  id: string
  empresa_id: string
  cliente_id: string | null
  numero_cotizacion: string
  tipo_sistema: TipoSistemaBombeo
  tipo_bomba: TipoBomba
  provincia: string | null
  profundidad_m: number | null
  caudal_m3h: number
  litros_dia_requeridos: number
  altura_descarga_m: number
  potencia_hp: number
  potencia_kw: number
  litros_disponibles: number | null
  kwp_necesario: number | null
  bomba_marca: string | null
  bomba_modelo: string | null
  bomba_hp: number | null
  bomba_precio: number | null
  panel_marca: string | null
  panel_modelo: string | null
  panel_w: number | null
  panel_cantidad: number | null
  panel_precio_unit: number | null
  vfd_marca: string | null
  vfd_modelo: string | null
  vfd_kw: number | null
  vfd_precio: number | null
  instalacion_usd: number
  total_usd: number
  estado: EstadoCotizacionBombeo
  notas: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  clientes?: {
    nombre: string
    telefono: string | null
    email: string | null
  } | null
}

export interface DesglosePrecioBombeo {
  bombaPrecio: number | ''
  panelPrecioUnit: number | ''
  panelCantidad: number | ''
  vfdPrecio: number | ''
  instalacionUsd: number | ''
}

export interface NuevaCotizacionBombeoInput {
  clienteNombre: string
  clienteId: string | null
  provincia: string
  tipoSistema: TipoSistemaBombeo
  tipoBomba: TipoBomba
  profundidadM: number | null
  caudalM3h: number
  litrosDiaRequeridos: number
  alturaDescargaM: number
  bombaMarca: string
  bombaModelo: string
  bombaHp: number | null
  bombaPrecio: number
  panelMarca: string | null
  panelModelo: string | null
  panelW: number | null
  panelCantidad: number | null
  panelPrecioUnit: number | null
  vfdMarca: string | null
  vfdModelo: string | null
  vfdKw: number | null
  vfdPrecio: number | null
  instalacionUsd: number
  totalUsd: number
  notas: string
  estado: EstadoCotizacionBombeo
}
