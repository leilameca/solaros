import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ClienteDetalleTabs } from '@/components/clientes/ClienteDetalleTabs'
import { CambiarEtapaCliente } from '@/components/clientes/CambiarEtapaCliente'
import { NuevaCotizacionClienteDropdown } from '@/components/clientes/NuevaCotizacionClienteDropdown'
import { createClient } from '@/lib/supabase/server'
import { ETIQUETAS_ETAPA_PIPELINE, ESTILOS_ETAPA_PIPELINE } from '@/lib/clientes'
import { cn } from '@/lib/utils'
import type { ClienteCRM, ClienteNota, HistorialCotizacionCliente } from '@/types/clientes'

export default async function ClienteDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [{ data: cliente, error }, { data: historial }, { data: notas }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, empresa_id, nombre, email, telefono, whatsapp, numero_contrato, provincia, notas, etapa_pipeline, created_at, updated_at')
      .eq('id', params.id)
      .single(),
    supabase
      .from('historial_cliente')
      .select('cliente_id, tipo, tipo_label, cotizacion_id, numero_cotizacion, total_usd, estado, created_at, ruta')
      .eq('cliente_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('cliente_notas')
      .select('id, empresa_id, cliente_id, nota, created_at, created_by')
      .eq('cliente_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (error || !cliente) notFound()
  const clienteActual = cliente as ClienteCRM

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-col sm:flex-row">
        <div className="flex items-center gap-3">
          <Link
            href="/clientes"
            className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
                {clienteActual.nombre}
              </h1>
              <Badge className={cn(ESTILOS_ETAPA_PIPELINE[clienteActual.etapa_pipeline])}>
                {ETIQUETAS_ETAPA_PIPELINE[clienteActual.etapa_pipeline]}
              </Badge>
            </div>
            <p className="text-[13px] text-[var(--text-3)] mt-0.5">
              Cliente desde{' '}
              {new Date(clienteActual.created_at).toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CambiarEtapaCliente clienteId={clienteActual.id} etapaActual={clienteActual.etapa_pipeline} />
          <NuevaCotizacionClienteDropdown clienteId={clienteActual.id} />
        </div>
      </div>

      <ClienteDetalleTabs
        cliente={clienteActual}
        historial={(historial ?? []) as HistorialCotizacionCliente[]}
        notas={(notas ?? []) as ClienteNota[]}
      />
    </div>
  )
}
