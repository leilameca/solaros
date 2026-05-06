export type EstadoCotizacionElectrica =
  | 'borrador'
  | 'enviada'
  | 'aprobada'
  | 'en_instalacion'
  | 'completada'
  | 'rechazada'

// Item con ID local (solo en cliente, durante edición del wizard)
export interface ItemElectricoLocal {
  localId: string
  descripcion: string
  unidad: string
  cantidad: number
  precio_unit_rd: number
  orden: number
}

// Item persistido en DB
export interface ItemElectricoDB {
  id: string
  cotizacion_id: string
  descripcion: string
  unidad: string
  cantidad: number
  precio_unit_rd: number
  orden: number
  created_at: string
}

export interface CatalogoMaterial {
  id: string
  empresa_id: string
  descripcion: string
  unidad: string
  precio_sugerido_rd: number
  categoria: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CotizacionElectrica {
  id: string
  empresa_id: string
  cliente_id: string | null
  numero_cotizacion: string
  tipo_trabajo: string
  descripcion: string | null
  mano_obra_rd: number
  subtotal_materiales_rd: number
  itbis_rd: number
  total_rd: number
  total_usd: number
  tasa_dolar: number
  estado: EstadoCotizacionElectrica
  notas: string | null
  cotizacion_solar_id: string | null
  cotizacion_bombeo_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  clientes?: {
    nombre: string
    telefono: string | null
    email: string | null
  } | null
  items?: ItemElectricoDB[]
  cotizaciones?: { numero_cotizacion: string } | null
  cotizaciones_bombeo?: { numero_cotizacion: string } | null
}

export interface TotalesElectrico {
  subtotal_materiales_rd: number
  itbis_rd: number
  total_rd: number
  total_usd: number
}

export interface NuevaCotizacionElectricaInput {
  clienteId: string | null
  clienteNombre: string
  tipoTrabajo: string
  descripcion: string
  items: Omit<ItemElectricoLocal, 'localId'>[]
  manoObraRd: number
  notas: string
  estado: EstadoCotizacionElectrica
  cotizacionSolarId: string | null
  cotizacionBombeoId: string | null
}

export interface NuevoCatalogoMaterialInput {
  descripcion: string
  unidad: string
  precioSugeridoRd: number
  categoria: string
}

export const ETIQUETAS_ESTADO_ELECTRICO: Record<EstadoCotizacionElectrica, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  en_instalacion: 'En instalación',
  completada: 'Completada',
  rechazada: 'Rechazada',
}
