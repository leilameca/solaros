import type { PermisosRol, RolUsuarioEmpresa } from '@/types/usuario'

export const PERMISOS: Record<RolUsuarioEmpresa, PermisosRol> = {
  admin: {
    cotizaciones: 'full',
    clientes: 'full',
    inventario: 'full',
    configuracion: 'full',
    reportes: 'full',
  },
  vendedor: {
    cotizaciones: 'create_read',
    clientes: 'create_read',
    inventario: 'read',
    configuracion: 'none',
    reportes: 'read',
  },
  tecnico: {
    cotizaciones: 'read',
    clientes: 'read',
    inventario: 'read_update',
    configuracion: 'none',
    reportes: 'none',
  },
}

export const SUPERADMIN_EMAIL = 'leilanycristaldedios@gmail.com'

export const LIMITES_PLAN = {
  basico: {
    usuarios_max: 1,
    cotizaciones_mes: 50,
    pdf_mes: 50,
    inventario: false,
    bombeo: true,
  },
  pro: {
    usuarios_max: 5,
    cotizaciones_mes: Number.POSITIVE_INFINITY,
    pdf_mes: Number.POSITIVE_INFINITY,
    inventario: true,
    bombeo: true,
  },
  enterprise: {
    usuarios_max: Number.POSITIVE_INFINITY,
    cotizaciones_mes: Number.POSITIVE_INFINITY,
    pdf_mes: Number.POSITIVE_INFINITY,
    inventario: true,
    bombeo: true,
  },
} as const
