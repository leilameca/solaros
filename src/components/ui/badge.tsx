import * as React from 'react'
import { cn } from '@/lib/utils'
import type { EstadoCotizacion } from '@/types/cotizaciones'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)]',
      success: 'bg-[var(--green-bg)] text-[var(--green)]',
      warning: 'bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-bd)]',
      danger: 'bg-[var(--red-bg)] text-[var(--red)]',
      info: 'bg-[var(--blue-bg)] text-[var(--blue)]',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'text-[11px] font-medium px-[9px] py-[3px] rounded-full font-[family-name:var(--font-sans)]',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

const ESTADO_VARIANT: Record<EstadoCotizacion, BadgeProps['variant']> = {
  borrador: 'default',
  enviada: 'info',
  aprobada: 'success',
  en_instalacion: 'warning',
  completada: 'success',
  rechazada: 'danger',
}

const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  en_instalacion: 'En instalación',
  completada: 'Completada',
  rechazada: 'Rechazada',
}

function BadgeEstado({ estado }: { estado: EstadoCotizacion }) {
  return (
    <Badge variant={ESTADO_VARIANT[estado]}>
      {ESTADO_LABEL[estado]}
    </Badge>
  )
}

export { Badge, BadgeEstado }
