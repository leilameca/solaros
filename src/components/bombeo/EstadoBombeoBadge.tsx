import { Badge } from '@/components/ui/badge'
import type { EstadoCotizacionBombeo } from '@/types/bombeo'

export const ETIQUETAS_ESTADO_BOMBEO: Record<EstadoCotizacionBombeo, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  en_instalacion: 'En instalacion',
  completada: 'Completada',
  rechazada: 'Rechazada',
}

const VARIANTES_ESTADO_BOMBEO: Record<
  EstadoCotizacionBombeo,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  borrador: 'default',
  enviada: 'info',
  aprobada: 'success',
  en_instalacion: 'warning',
  completada: 'success',
  rechazada: 'danger',
}

export function EstadoBombeoBadge({
  estado,
}: {
  estado: EstadoCotizacionBombeo
}) {
  return (
    <Badge variant={VARIANTES_ESTADO_BOMBEO[estado]}>
      {ETIQUETAS_ESTADO_BOMBEO[estado]}
    </Badge>
  )
}
