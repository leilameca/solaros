import type { EtapaPipeline } from '@/types/clientes'

export const ETAPAS_PIPELINE: EtapaPipeline[] = [
  'prospecto',
  'cotizado',
  'negociando',
  'aprobado',
  'instalado',
  'perdido',
]

export const ETIQUETAS_ETAPA_PIPELINE: Record<EtapaPipeline, string> = {
  prospecto: 'Prospecto',
  cotizado: 'Cotizado',
  negociando: 'Negociando',
  aprobado: 'Aprobado',
  instalado: 'Instalado',
  perdido: 'Perdido',
}

export const ESTILOS_ETAPA_PIPELINE: Record<EtapaPipeline, string> = {
  prospecto: 'bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)]',
  cotizado: 'bg-[var(--blue-bg)] text-[var(--blue)]',
  negociando: 'bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-bd)]',
  aprobado: 'bg-[var(--green-bg)] text-[var(--green)]',
  instalado: 'bg-[color:rgba(26,122,74,0.18)] text-[var(--green)] border border-[rgba(26,122,74,0.24)]',
  perdido: 'bg-[var(--red-bg)] text-[var(--red)]',
}

export function normalizarTextoBusqueda(valor: string | null | undefined) {
  return (valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function limpiarTelefono(valor: string | null | undefined) {
  return (valor ?? '').replace(/\D/g, '')
}

export function construirWhatsappLink(whatsapp: string | null | undefined, telefono?: string | null) {
  const base = limpiarTelefono(whatsapp) || limpiarTelefono(telefono)
  if (!base) return null

  const numero = base.length === 10 ? `1${base}` : base
  return `https://wa.me/${numero}`
}
