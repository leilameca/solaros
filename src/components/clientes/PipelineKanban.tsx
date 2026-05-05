'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Mail, Phone, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ETAPAS_PIPELINE, ETIQUETAS_ETAPA_PIPELINE, ESTILOS_ETAPA_PIPELINE, construirWhatsappLink } from '@/lib/clientes'
import { cn } from '@/lib/utils'
import type { ClienteCRM, EtapaPipeline } from '@/types/clientes'

export function PipelineKanban({
  clientes,
  onMoverCliente,
}: {
  clientes: ClienteCRM[]
  onMoverCliente: (clienteId: string, etapa: EtapaPipeline) => void
}) {
  const [esMobile, setEsMobile] = useState(false)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const actualizar = () => setEsMobile(media.matches)
    actualizar()
    media.addEventListener('change', actualizar)
    return () => media.removeEventListener('change', actualizar)
  }, [])

  const agrupados = useMemo(
    () =>
      ETAPAS_PIPELINE.reduce<Record<EtapaPipeline, ClienteCRM[]>>((acc, etapa) => {
        acc[etapa] = clientes.filter((cliente) => cliente.etapa_pipeline === etapa)
        return acc
      }, {
        prospecto: [],
        cotizado: [],
        negociando: [],
        aprobado: [],
        instalado: [],
        perdido: [],
      }),
    [clientes]
  )

  if (esMobile) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {ETAPAS_PIPELINE.map((etapa) => (
          <div
            key={etapa}
            className="min-w-[280px] snap-start bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          >
            <ColumnHeader etapa={etapa} cantidad={agrupados[etapa].length} />
            <div className="p-3 space-y-3">
              {agrupados[etapa].map((cliente) => (
                <ClienteCard key={cliente.id} cliente={cliente} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const clienteId = String(event.active.id)
    const etapaDestino = event.over?.id as EtapaPipeline | undefined
    if (!etapaDestino) return

    const cliente = clientes.find((item) => item.id === clienteId)
    if (!cliente || cliente.etapa_pipeline === etapaDestino) return

    onMoverCliente(clienteId, etapaDestino)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {ETAPAS_PIPELINE.map((etapa) => (
          <KanbanColumn key={etapa} etapa={etapa}>
            {agrupados[etapa].map((cliente) => (
              <DraggableClienteCard key={cliente.id} cliente={cliente} />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  )
}

function KanbanColumn({
  etapa,
  children,
}: {
  etapa: EtapaPipeline
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] min-h-[220px] transition-colors',
        isOver && 'border-[var(--accent)] bg-[var(--accent-bg)]'
      )}
    >
      <ColumnHeader etapa={etapa} cantidad={Array.isArray(children) ? children.length : 0} />
      <div className="p-3 space-y-3">{children}</div>
    </div>
  )
}

function ColumnHeader({
  etapa,
  cantidad,
}: {
  etapa: EtapaPipeline
  cantidad: number
}) {
  return (
    <div className="px-3 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3">
      <Badge className={cn(ESTILOS_ETAPA_PIPELINE[etapa])}>
        {ETIQUETAS_ETAPA_PIPELINE[etapa]}
      </Badge>
      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-3)]">
        {cantidad}
      </span>
    </div>
  )
}

function DraggableClienteCard({ cliente }: { cliente: ClienteCRM }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: cliente.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={cn(isDragging && 'opacity-70')}
      {...listeners}
      {...attributes}
    >
      <ClienteCard cliente={cliente} />
    </div>
  )
}

function ClienteCard({ cliente }: { cliente: ClienteCRM }) {
  const whatsappLink = construirWhatsappLink(cliente.whatsapp, cliente.telefono)

  return (
    <Link
      href={`/clientes/${cliente.id}`}
      className="block bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3 hover:bg-[var(--surface)] transition-colors"
    >
      <p className="text-[13px] font-medium text-[var(--text)]">{cliente.nombre}</p>
      <div className="mt-2 space-y-1">
        {cliente.telefono && (
          <p className="text-[12px] text-[var(--text-3)]">{cliente.telefono}</p>
        )}
        {cliente.numero_contrato && (
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-3)]">
            Contrato {cliente.numero_contrato}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {cliente.telefono && (
          <a
            href={`tel:${cliente.telefono}`}
            onClick={(event) => event.stopPropagation()}
            className="flex items-center justify-center h-7 w-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex items-center justify-center h-7 w-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        )}
        {cliente.email && (
          <a
            href={`mailto:${cliente.email}`}
            onClick={(event) => event.stopPropagation()}
            className="flex items-center justify-center h-7 w-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </Link>
  )
}
