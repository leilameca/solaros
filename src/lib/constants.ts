import type { TipoTarifa } from '@/types/cotizaciones'

export const HORAS_SOL: Record<string, number> = {
  'Santiago': 4.11,
  'La Vega': 4.11,
  'Duarte': 4.11,
  'Espaillat': 4.11,
  'Hermanas Mirabal': 4.11,
  'María Trinidad Sánchez': 4.11,
  'Samaná': 4.11,
  'Sánchez Ramírez': 4.11,
  'Puerto Plata': 4.11,
  'Monseñor Nouel': 4.11,
  'Santiago Rodríguez': 4.23,
  'Valverde': 4.23,
  'Dajabón': 4.23,
  'Monte Cristi': 4.23,
  'Distrito Nacional': 4.00,
  'Santo Domingo': 4.00,
  // La Vega tiene municipios especiales por altitud
  'Constanza': 3.97,
  'Jarabacoa': 3.97,
  // Resto de provincias (default solar zone)
  'Azua': 4.00,
  'Baoruco': 4.00,
  'Barahona': 4.00,
  'Elías Piña': 4.00,
  'El Seibo': 4.00,
  'Hato Mayor': 4.00,
  'Independencia': 4.00,
  'La Altagracia': 4.00,
  'La Romana': 4.00,
  'Monte Plata': 4.00,
  'Pedernales': 4.00,
  'Peravia': 4.00,
  'San Cristóbal': 4.00,
  'San José de Ocoa': 4.00,
  'San Juan': 4.00,
  'San Pedro de Macorís': 4.00,
}

export const HORAS_SOL_DEFAULT = 4.00

export const TARIFAS: Record<TipoTarifa, number> = {
  'BTS-1': 14.04,
  'BTS-2': 14.38,
  'BTD': 7.37,
  'BTH': 7.26,
  'MTD1': 15.11,
  'MTD2': 7.38,
  'MTH': 7.26,
}

export const DEGRADACION_MENSUAL: Record<number, number> = {
  1: 0.07,
  2: 0.04,
  3: 0.03,
  4: 0.02,
  5: 0.01,
  6: 0.01,
  7: 0.00,
  8: 0.00,
  9: 0.00,
  10: 0.05,
  11: 0.06,
  12: 0.07,
}

export const NOMBRES_MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export const LOSS_FACTOR = 0.06
export const DEGRADACION_ANUAL = 0.006
export const DESCUENTO_LEY5707 = 0.38
export const ANOS_LEY5707 = 3
export const PANEL_W_DEFAULT = 550
export const TASA_DOLAR_DEFAULT = 54
export const PRECIO_WP_DEFAULT = 0.85

export const PROVINCIAS_RD = [
  'Azua',
  'Baoruco',
  'Barahona',
  'Constanza',
  'Dajabón',
  'Distrito Nacional',
  'Duarte',
  'Elías Piña',
  'El Seibo',
  'Espaillat',
  'Hato Mayor',
  'Hermanas Mirabal',
  'Independencia',
  'Jarabacoa',
  'La Altagracia',
  'La Romana',
  'La Vega',
  'María Trinidad Sánchez',
  'Monseñor Nouel',
  'Monte Cristi',
  'Monte Plata',
  'Pedernales',
  'Peravia',
  'Puerto Plata',
  'Samaná',
  'San Cristóbal',
  'San José de Ocoa',
  'San Juan',
  'San Pedro de Macorís',
  'Sánchez Ramírez',
  'Santiago',
  'Santiago Rodríguez',
  'Santo Domingo',
  'Valverde',
]

export const ETIQUETAS_TARIFA: Record<TipoTarifa, string> = {
  'BTS-1': 'BTS-1 — Baja Tensión Simple 1',
  'BTS-2': 'BTS-2 — Baja Tensión Simple 2',
  'BTD': 'BTD — Baja Tensión con Demanda',
  'BTH': 'BTH — Baja Tensión Horaria',
  'MTD1': 'MTD1 — Media Tensión con Demanda 1',
  'MTD2': 'MTD2 — Media Tensión con Demanda 2',
  'MTH': 'MTH — Media Tensión Horaria',
}

export const ETIQUETAS_SISTEMA = {
  on_grid: 'On-grid (inyección a la red)',
  off_grid: 'Off-grid (con baterías)',
  hibrido: 'Híbrido (baterías + red)',
}

export const ETIQUETAS_ESTADO = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  en_instalacion: 'En instalación',
  completada: 'Completada',
  rechazada: 'Rechazada',
}
