export type EtapaPipeline =
  | 'prospecto'
  | 'cotizado'
  | 'negociando'
  | 'aprobado'
  | 'instalado'
  | 'perdido'

export interface ClienteCRM {
  id: string
  empresa_id: string
  nombre: string
  email: string | null
  telefono: string | null
  whatsapp: string | null
  numero_contrato: string | null
  provincia: string | null
  notas: string | null
  etapa_pipeline: EtapaPipeline
  created_at: string
  updated_at: string
}

export interface ClienteNota {
  id: string
  empresa_id: string
  cliente_id: string
  nota: string
  created_at: string
  created_by: string | null
  usuarios?: {
    nombre: string
    email: string
  } | null
}

export interface HistorialCotizacionCliente {
  cliente_id: string
  tipo: 'solar' | 'bombeo' | 'electrico'
  tipo_label: 'Solar' | 'Bombeo' | 'Electrico'
  cotizacion_id: string
  numero_cotizacion: string
  total_usd: number
  estado: string
  created_at: string
  ruta: string
}

export interface NuevaClienteInput {
  nombre: string
  email: string
  telefono: string
  whatsapp: string
  numero_contrato: string
  provincia: string
  notas: string
  etapa_pipeline: EtapaPipeline
}

export interface ResumenCliente {
  totalCotizaciones: number
  montoTotalUsd: number
  ultimaActividad: string | null
}
