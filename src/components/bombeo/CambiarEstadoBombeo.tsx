'use client'

import { useTransition } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { actualizarEstadoCotizacionBombeo } from '@/app/(dashboard)/bombeo/actions'
import { EstadoBombeoBadge } from '@/components/bombeo/EstadoBombeoBadge'
import type { EstadoCotizacionBombeo } from '@/types/bombeo'

const TRANSICIONES: Record<EstadoCotizacionBombeo, EstadoCotizacionBombeo[]> = {
  borrador: ['enviada', 'rechazada'],
  enviada: ['aprobada', 'rechazada'],
  aprobada: ['en_instalacion', 'rechazada'],
  en_instalacion: ['completada'],
  completada: [],
  rechazada: ['borrador'],
}

export function CambiarEstadoBombeo({
  cotizacionId,
  estadoActual,
}: {
  cotizacionId: string
  estadoActual: EstadoCotizacionBombeo
}) {
  const [isPending, startTransition] = useTransition()
  const siguientesEstados = TRANSICIONES[estadoActual] ?? []

  if (siguientesEstados.length === 0) return null

  function cambiarEstado(nuevoEstado: EstadoCotizacionBombeo) {
    startTransition(async () => {
      await actualizarEstadoCotizacionBombeo(cotizacionId, nuevoEstado)
    })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={isPending}
          className="flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] bg-transparent border border-[var(--border-s)] text-[var(--text)] text-[12px] font-medium hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Cambiar estado'}
          <ChevronDown className="h-3 w-3 text-[var(--text-3)]" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[180px] bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-1"
        >
          <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
            Cambiar a
          </p>
          {siguientesEstados.map((estado) => (
            <DropdownMenu.Item
              key={estado}
              onSelect={() => cambiarEstado(estado)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] cursor-pointer outline-none focus:bg-[var(--surface-2)]"
            >
              <EstadoBombeoBadge estado={estado} />
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
