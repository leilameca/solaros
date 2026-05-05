'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { LayoutGrid, List, Mail, MessageCircle, Phone, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PipelineKanban } from '@/components/clientes/PipelineKanban'
import { ETAPAS_PIPELINE, ETIQUETAS_ETAPA_PIPELINE, ESTILOS_ETAPA_PIPELINE, construirWhatsappLink, limpiarTelefono, normalizarTextoBusqueda } from '@/lib/clientes'
import { actualizarEtapaCliente } from '@/app/(dashboard)/clientes/actions'
import { cn } from '@/lib/utils'
import type { ClienteCRM, EtapaPipeline } from '@/types/clientes'

export function ClientesView({
  clientesIniciales,
}: {
  clientesIniciales: ClienteCRM[]
}) {
  const [clientes, setClientes] = useState(clientesIniciales)
  const [vista, setVista] = useState<'lista' | 'kanban'>('lista')
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState<'todos' | EtapaPipeline>('todos')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const timer = setTimeout(() => setBusqueda(busquedaInput), 300)
    return () => clearTimeout(timer)
  }, [busquedaInput])

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((cliente) => {
      const coincideEtapa = filtroEtapa === 'todos' || cliente.etapa_pipeline === filtroEtapa
      const q = normalizarTextoBusqueda(busqueda)
      if (!q) return coincideEtapa

      return coincideEtapa && (
        normalizarTextoBusqueda(cliente.nombre).includes(q) ||
        normalizarTextoBusqueda(cliente.telefono).includes(q) ||
        limpiarTelefono(cliente.telefono).includes(limpiarTelefono(q)) ||
        normalizarTextoBusqueda(cliente.numero_contrato).includes(q)
      )
    })
  }, [clientes, busqueda, filtroEtapa])

  function moverCliente(clienteId: string, etapa: EtapaPipeline) {
    const anterior = clientes
    setClientes((prev) =>
      prev.map((cliente) => (
        cliente.id === clienteId ? { ...cliente, etapa_pipeline: etapa } : cliente
      ))
    )

    startTransition(async () => {
      const response = await actualizarEtapaCliente(clienteId, etapa)
      if (response?.error) {
        setClientes(anterior)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar por nombre, telefono o contrato..."
            className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />

          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value as 'todos' | EtapaPipeline)}
            className="w-full sm:w-[220px] bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="todos">Todas las etapas</option>
            {ETAPAS_PIPELINE.map((etapa) => (
              <option key={etapa} value={etapa}>{ETIQUETAS_ETAPA_PIPELINE[etapa]}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--border-s)] p-1 bg-[var(--surface)]">
            <button
              type="button"
              onClick={() => setVista('lista')}
              className={cn(
                'h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors inline-flex items-center gap-1.5',
                vista === 'lista'
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setVista('kanban')}
              className={cn(
                'h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors inline-flex items-center gap-1.5',
                vista === 'kanban'
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
          </div>

          <Link href="/clientes/nuevo">
            <Button variant="accent" size="md">
              <Plus className="h-3.5 w-3.5" />
              Nuevo cliente
            </Button>
          </Link>
        </div>
      </div>

      {vista === 'kanban' ? (
        <PipelineKanban clientes={clientesFiltrados} onMoverCliente={moverCliente} />
      ) : (
        <div className="space-y-3">
          {clientesFiltrados.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <p className="text-[13px] text-[var(--text-3)]">
                No hay clientes que coincidan con la búsqueda actual.
              </p>
            </div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <ClienteFila key={cliente.id} cliente={cliente} />
            ))
          )}
        </div>
      )}

      {isPending && (
        <p className="text-[12px] text-[var(--text-3)]">
          Actualizando etapa del cliente...
        </p>
      )}
    </div>
  )
}

function ClienteFila({ cliente }: { cliente: ClienteCRM }) {
  const whatsappLink = construirWhatsappLink(cliente.whatsapp, cliente.telefono)

  return (
    <Link
      href={`/clientes/${cliente.id}`}
      className="block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:bg-[var(--surface-2)] transition-colors"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-medium text-[var(--text)]">{cliente.nombre}</p>
            <Badge className={cn(ESTILOS_ETAPA_PIPELINE[cliente.etapa_pipeline])}>
              {ETIQUETAS_ETAPA_PIPELINE[cliente.etapa_pipeline]}
            </Badge>
          </div>

          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {cliente.telefono && (
              <span className="text-[12px] text-[var(--text-2)]">{cliente.telefono}</span>
            )}
            {cliente.email && (
              <span className="text-[12px] text-[var(--text-3)]">{cliente.email}</span>
            )}
            {cliente.numero_contrato && (
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-3)]">
                Contrato {cliente.numero_contrato}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cliente.telefono && (
            <a
              href={`tel:${cliente.telefono}`}
              onClick={(event) => event.stopPropagation()}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
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
              className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
          {cliente.email && (
            <a
              href={`mailto:${cliente.email}`}
              onClick={(event) => event.stopPropagation()}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}
