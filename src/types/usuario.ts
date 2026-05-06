export type RolUsuarioEmpresa = 'admin' | 'vendedor' | 'tecnico'
export type PermisoNivel = 'none' | 'read' | 'create_read' | 'read_update' | 'full'

export interface PermisosRol {
  cotizaciones: PermisoNivel
  clientes: PermisoNivel
  inventario: PermisoNivel
  configuracion: PermisoNivel
  reportes: PermisoNivel
}

export interface UsuarioApp {
  id: string
  empresa_id: string | null
  nombre: string
  email: string
  rol: RolUsuarioEmpresa
  cargo: string | null
  telefono: string | null
  activo: boolean
  esSuperadmin: boolean
}

export interface EmpresaResumenApp {
  id: string | null
  nombre: string
  plan_actual: 'basico' | 'pro' | 'enterprise'
  suscripcion_estado: 'trial' | 'activa' | 'vencida' | 'suspendida' | 'cancelada'
  onboarding_completado: boolean
}

export interface ContextoUsuarioApp {
  usuario: UsuarioApp | null
  empresa: EmpresaResumenApp | null
}
