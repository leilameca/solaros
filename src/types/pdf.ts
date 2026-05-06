import type { Cotizacion, ConsumoMensual } from './cotizaciones'
import type { CotizacionBombeo } from './bombeo'
import type { CotizacionElectrica, ItemElectricoDB } from './electrico'

export interface EmpresaPDFConfig {
  id: string
  nombre_empresa: string
  logo_url: string | null
  email: string | null
  telefono: string | null
  tasa_dolar: number
}

export interface DatosPropuestaSolar {
  cotizacion: Cotizacion & {
    clientes: {
      nombre: string
      telefono: string | null
      email: string | null
      numero_contrato?: string | null
    } | null
  }
  consumoMensual: ConsumoMensual[]
  empresa: EmpresaPDFConfig
  imagenGrafico?: string
}

export interface DatosPropuestaBombeo {
  cotizacion: CotizacionBombeo & {
    clientes: {
      nombre: string
      telefono: string | null
      email: string | null
    } | null
  }
  empresa: EmpresaPDFConfig
}

export interface DatosPropuestaElectrico {
  cotizacion: CotizacionElectrica & {
    clientes: {
      nombre: string
      telefono: string | null
      email: string | null
    } | null
  }
  items: ItemElectricoDB[]
  empresa: EmpresaPDFConfig
}
