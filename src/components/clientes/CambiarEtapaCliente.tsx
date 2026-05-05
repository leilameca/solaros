'use client'

import { useState, useTransition } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { actualizarEtapaCliente } from '@/app/(dashboard)/clientes/actions'
import { ETAPAS_PIPELINE, ETIQUETAS_ETAPA_PIPELINE, ESTILOS_ETAPA_PIPELINE } from '@/lib/clientes'
import { cn } from '@/lib/utils'
import type { EtapaPipeline } from '@/types/clientes'

export function CambiarEtapaCliente({
  clienteId,
  etapaActual,
}: {
  clienteId: string
  etapaActual: EtapaPipeline
}) {
  const [isPending, startTransition] = useTransition()
  const [etapaLocal, setEtapaLocal] = useState(etapaActual)

  function cambiar(etapa: EtapaPipeline) {
    const anterior = etapaLocal
    setEtapaLocal(etapa)
    startTransition(async () => {
      const response = await actualizarEtapaCliente(clienteId, etapa)
      if (response?.error) {
        setEtapaLocal(anterior)
      }
    })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={isPending}
          className="flex items-center gap-2 h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border-s)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
        >
          <Badge className={cn(ESTILOS_ETAPA_PIPELINE[etapaLocal])}>
            {ETIQUETAS_ETAPA_PIPELINE[etapaLocal]}
          </Badge>
          <ChevronDown className="h-3 w-3 text-[var(--text-3)]" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[200px] bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-1"
        >
          <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
            Cambiar etapa
          </p>
          {ETAPAS_PIPELINE.map((etapa) => (
            <DropdownMenu.Item
              key={etapa}
              onSelect={() => cambiar(etapa)}
              className="flex items-center px-2 py-1.5 rounded-[var(--radius-sm)] cursor-pointer outline-none focus:bg-[var(--surface-2)]"
            >
              <Badge className={cn(ESTILOS_ETAPA_PIPELINE[etapa])}>
                {ETIQUETAS_ETAPA_PIPELINE[etapa]}
              </Badge>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
