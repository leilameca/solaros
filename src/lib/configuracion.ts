import type {
  EstadoSuscripcionEmpresa,
  PlanSuscripcionEmpresa,
  RolUsuarioEmpresa,
  TabConfiguracion,
} from '@/types/configuracion'

export const TABS_CONFIGURACION: Array<{
  id: TabConfiguracion
  label: string
}> = [
  { id: 'empresa', label: 'Mi empresa' },
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'operativo', label: 'Operativo' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'suscripcion', label: 'Suscripción' },
  { id: 'tutorial', label: 'Tutorial' },
]

export const COLORES_ACENTO = [
  { valor: '#C8860A', label: 'Dorado solar' },
  { valor: '#1A7A4A', label: 'Verde energía' },
  { valor: '#1B5FA8', label: 'Azul técnico' },
  { valor: '#7C3AED', label: 'Violeta moderno' },
  { valor: '#DC2626', label: 'Rojo corporativo' },
  { valor: '#0F766E', label: 'Teal profesional' },
] as const

export const LIMITE_USUARIOS: Record<PlanSuscripcionEmpresa, number> = {
  basico: 1,
  pro: 5,
  enterprise: Number.POSITIVE_INFINITY,
}

export const TRIAL_MESES_GRATIS = 3

export const PLANES_SOLAR_OS: Record<
  PlanSuscripcionEmpresa,
  {
    precioUsd: number
    usuarios: string
    cotizacionesMes: string
    propuestasMes: string
    incluyeBombeo: string
    incluyeInventario: string
    soporte: string
  }
> = {
  basico: {
    precioUsd: 10,
    usuarios: '1',
    cotizacionesMes: '50',
    propuestasMes: '50',
    incluyeBombeo: 'Sí',
    incluyeInventario: 'No',
    soporte: 'Email',
  },
  pro: {
    precioUsd: 20,
    usuarios: '5',
    cotizacionesMes: 'Ilimitadas',
    propuestasMes: 'Ilimitadas',
    incluyeBombeo: 'Sí',
    incluyeInventario: 'Sí',
    soporte: 'Prioritario',
  },
  enterprise: {
    precioUsd: 40,
    usuarios: 'Ilimitados',
    cotizacionesMes: 'Ilimitadas',
    propuestasMes: 'Ilimitadas',
    incluyeBombeo: 'Sí',
    incluyeInventario: 'Sí',
    soporte: 'Dedicado',
  },
}

export const ETIQUETAS_ROL_USUARIO: Record<RolUsuarioEmpresa, string> = {
  admin: 'Admin',
  vendedor: 'Vendedor',
  tecnico: 'Técnico',
}

export const VARIANTES_ROL_USUARIO: Record<RolUsuarioEmpresa, 'warning' | 'info' | 'default'> = {
  admin: 'warning',
  vendedor: 'info',
  tecnico: 'default',
}

export const ETIQUETAS_ESTADO_SUSCRIPCION: Record<EstadoSuscripcionEmpresa, string> = {
  trial: 'Prueba',
  activa: 'Activa',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
  suspendida: 'Suspendida',
}

export const TEXTO_TERMINOS_PDF_SUGERIDO =
  'Esta propuesta tiene una validez de 30 días a partir de la fecha de emisión.\n' +
  'Los precios están sujetos a variación según disponibilidad de equipos.\n' +
  'La instalación incluye garantía de 1 año en mano de obra.'

export function formatearFechaLargaConfiguracion(valor: string | null) {
  if (!valor) return 'Sin fecha'

  return new Date(valor).toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatearUSDConfiguracion(valor: number | null) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0))
}

export function capitalizarPlan(plan: PlanSuscripcionEmpresa) {
  if (plan === 'enterprise') return 'Enterprise'
  if (plan === 'pro') return 'Pro'
  return 'Básico'
}

export function sumarMeses(fecha: Date, meses: number) {
  const copia = new Date(fecha)
  copia.setMonth(copia.getMonth() + meses)
  return copia
}
