'use client'

import { type ReactNode, useState } from 'react'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { FeedNotas } from '@/components/clientes/FeedNotas'
import { HistorialCotizaciones } from '@/components/clientes/HistorialCotizaciones'
import { Badge } from '@/components/ui/badge'
import { construirWhatsappLink, ETIQUETAS_ETAPA_PIPELINE, ESTILOS_ETAPA_PIPELINE } from '@/lib/clientes'
import { cn } from '@/lib/utils'
import type { ClienteCRM, ClienteNota, HistorialCotizacionCliente } from '@/types/clientes'

type TabActiva = 'cotizaciones' | 'seguimiento' | 'datos'

export function ClienteDetalleTabs({
  cliente,
  historial,
  notas,
}: {
  cliente: ClienteCRM
  historial: HistorialCotizacionCliente[]
  notas: ClienteNota[]
}) {
  const [tab, setTab] = useState<TabActiva>('cotizaciones')
  const whatsappLink = construirWhatsappLink(cliente.whatsapp, cliente.telefono)

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--border-s)] p-1 bg-[var(--surface)]">
        <TabButton actual={tab} valor="cotizaciones" onClick={setTab}>
          Cotizaciones
        </TabButton>
        <TabButton actual={tab} valor="seguimiento" onClick={setTab}>
          Seguimiento
        </TabButton>
        <TabButton actual={tab} valor="datos" onClick={setTab}>
          Datos
        </TabButton>
      </div>

      {tab === 'cotizaciones' && <HistorialCotizaciones items={historial} />}
      {tab === 'seguimiento' && <FeedNotas clienteId={cliente.id} notasIniciales={notas} />}
      {tab === 'datos' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn(ESTILOS_ETAPA_PIPELINE[cliente.etapa_pipeline])}>
              {ETIQUETAS_ETAPA_PIPELINE[cliente.etapa_pipeline]}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info label="Nombre" value={cliente.nombre} />
            <Info label="Provincia" value={cliente.provincia || 'Sin provincia'} />
            <Info label="Telefono" value={cliente.telefono || 'Sin telefono'} />
            <Info label="WhatsApp" value={cliente.whatsapp || cliente.telefono || 'Sin WhatsApp'} />
            <Info label="Email" value={cliente.email || 'Sin email'} />
            <Info label="Contrato" value={cliente.numero_contrato || 'Sin contrato'} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {cliente.telefono && (
              <a
                href={`tel:${cliente.telefono}`}
                className="inline-flex items-center gap-2 h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[12px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Llamar
              </a>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[12px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
            {cliente.email && (
              <a
                href={`mailto:${cliente.email}`}
                className="inline-flex items-center gap-2 h-8 px-3 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[12px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
            )}
          </div>

          {cliente.notas && (
            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
                Notas generales
              </p>
              <p className="text-[13px] text-[var(--text-2)] leading-relaxed whitespace-pre-wrap">
                {cliente.notas}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({
  actual,
  valor,
  onClick,
  children,
}: {
  actual: TabActiva
  valor: TabActiva
  onClick: (tab: TabActiva) => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(valor)}
      className={cn(
        'h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors',
        actual === valor
          ? 'bg-[var(--text)] text-[var(--bg)]'
          : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
      )}
    >
      {children}
    </button>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
        {label}
      </p>
      <p className="text-[13px] text-[var(--text)]">{value}</p>
    </div>
  )
}
