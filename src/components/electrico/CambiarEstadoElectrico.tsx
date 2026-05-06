'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { actualizarEstadoCotizacionElectrica } from '@/app/(dashboard)/electrico/actions'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import type { EstadoCotizacionElectrica } from '@/types/electrico'
import { ETIQUETAS_ESTADO_ELECTRICO } from '@/types/electrico'

const TRANSICIONES: Record<EstadoCotizacionElectrica, EstadoCotizacionElectrica[]> = {
  borrador: ['enviada', 'rechazada'],
  enviada: ['aprobada', 'borrador', 'rechazada'],
  aprobada: ['en_instalacion', 'rechazada'],
  en_instalacion: ['completada', 'rechazada'],
  completada: [],
  rechazada: ['borrador'],
}

interface Props {
  cotizacionId: string
  estadoActual: EstadoCotizacionElectrica
}

export function CambiarEstadoElectrico({ cotizacionId, estadoActual }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const opciones = TRANSICIONES[estadoActual]

  if (opciones.length === 0) return null

  function cambiar(nuevoEstado: EstadoCotizacionElectrica) {
    startTransition(async () => {
      const res = await actualizarEstadoCotizacionElectrica(cotizacionId, nuevoEstado)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Estado actualizado')
        router.refresh()
      }
    })
  }

  return (
    <div className="relative group">
      <Button variant="secondary" size="sm" disabled={isPending}>
        <ChevronDown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {isPending ? 'Cambiando...' : 'Cambiar estado'}
        </span>
      </Button>
      <div className="absolute right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-10 py-1 hidden group-hover:block min-w-[160px]">
        {opciones.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => cambiar(op)}
            className="w-full text-left px-3 py-2 text-[12px] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {ETIQUETAS_ESTADO_ELECTRICO[op]}
          </button>
        ))}
      </div>
    </div>
  )
}
