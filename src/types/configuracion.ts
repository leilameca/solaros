export type TabConfiguracion =
  | 'empresa'
  | 'apariencia'
  | 'operativo'
  | 'usuarios'
  | 'suscripcion'
  | 'tutorial'

export type RolUsuarioEmpresa = 'admin' | 'vendedor' | 'tecnico'
export type PlanSuscripcionEmpresa = 'basico' | 'pro' | 'enterprise'
export type EstadoSuscripcionEmpresa = 'trial' | 'activa' | 'cancelada' | 'vencida' | 'suspendida'

export interface DatosEmpresa {
  nombre: string
  rnc: string
  telefono: string
  email: string
  direccion: string
  provincia: string
  representante: string
  cargo_representante: string
}

export interface AparienciaEmpresa {
  logo_url: string | null
  color_primario: string
}

export interface ConfigOperativa {
  precio_wp: number
  tasa_dolar: number
  terminos_pdf: string
}

export interface UsuarioEmpresa {
  id: string
  nombre: string
  email: string
  rol: RolUsuarioEmpresa
  cargo: string | null
  activo: boolean
  created_at: string
}

export interface UsuarioActualConfiguracion extends UsuarioEmpresa {
  empresa_id: string | null
}

export interface SuscripcionEmpresa {
  plan_actual: PlanSuscripcionEmpresa
  suscripcion_estado: EstadoSuscripcionEmpresa
  trial_ends_at: string | null
  suscripcion_renueva_en: string | null
  suscripcion_monto_usd: number | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export interface EmpresaConfiguracion
  extends DatosEmpresa,
    AparienciaEmpresa,
    ConfigOperativa,
    SuscripcionEmpresa {
  id: string | null
}

export interface ConfiguracionEmpresaData {
  usuarioActual: UsuarioActualConfiguracion
  empresa: EmpresaConfiguracion
  usuarios: UsuarioEmpresa[]
  modoInicial: boolean
  usuariosActivos: number
  limiteUsuarios: number | null
}

export interface GuardarEmpresaInput extends DatosEmpresa {}

export interface GuardarOperativoInput extends ConfigOperativa {}

export interface ActualizarUsuarioEmpresaInput {
  usuarioId: string
  rol?: RolUsuarioEmpresa
  cargo?: string | null
  activo?: boolean
}

export interface InvitarUsuarioEmpresaInput {
  nombre: string
  email: string
  rol: Exclude<RolUsuarioEmpresa, 'admin'>
  cargo?: string
}

export interface ResultadoAccionConfiguracion {
  ok?: boolean
  error?: string
  message?: string
}

export interface FeedbackConfiguracion {
  type: 'success' | 'error'
  message: string
}
