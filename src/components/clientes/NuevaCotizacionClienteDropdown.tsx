'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import { ChevronDown, Droplets, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NuevaCotizacionClienteDropdown({
  clienteId,
}: {
  clienteId: string
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="accent" size="sm">
          Nueva cotizacion
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[220px] bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-1"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={`/cotizaciones/nueva?cliente_id=${clienteId}`}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--text)] outline-none focus:bg-[var(--surface-2)]"
            >
              <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
              Sistema solar
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href={`/bombeo/nueva?cliente_id=${clienteId}`}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--text)] outline-none focus:bg-[var(--surface-2)]"
            >
              <Droplets className="h-3.5 w-3.5 text-[var(--blue)]" />
              Sistema de bombeo
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href={`/electrico/nueva?cliente_id=${clienteId}`}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--text)] outline-none focus:bg-[var(--surface-2)]"
            >
              <Zap className="h-3.5 w-3.5 text-[var(--text-2)]" />
              Servicio electrico
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
