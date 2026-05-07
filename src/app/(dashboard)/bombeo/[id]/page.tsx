import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit } from 'lucide-react'
import { createClient, obtenerConfigEmpresa } from '@/lib/supabase/server'
import { SeccionCobro } from '@/components/cobros/SeccionCobro'
import { Button } from '@/components/ui/button'
import { CambiarEstadoBombeo } from '@/components/bombeo/CambiarEstadoBombeo'
import { DesglosePrecio } from '@/components/bombeo/DesglosePrecio'
import { EstadoBombeoBadge } from '@/components/bombeo/EstadoBombeoBadge'
import { IndicadorCaudal } from '@/components/bombeo/IndicadorCaudal'
import { ResumenTecnico } from '@/components/bombeo/ResumenTecnico'
import { BotonGenerarPDF } from '@/components/pdf/BotonGenerarPDF'
import { formatearUSD } from '@/lib/calculos'
import type { CotizacionBombeo } from '@/types/bombeo'

export default async function DetalleCotizacionBombeoPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [{ data, error }, empresaConfig, planCobro] = await Promise.all([
    supabase
      .from('cotizaciones_bombeo')
      .select('*, clientes(nombre, telefono, email)')
      .eq('id', params.id)
      .single(),
    obtenerConfigEmpresa(),
    supabase
      .from('planes_pago')
      .select('id, estado, plan_pago_cuotas(porcentaje, estado)')
      .eq('cotizacion_id', params.id)
      .maybeSingle(),
  ])

  if (error || !data) notFound()

  const cotizacion = data as unknown as CotizacionBombeo

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/bombeo"
            className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
                {cotizacion.numero_cotizacion}
              </h1>
              <EstadoBombeoBadge estado={cotizacion.estado} />
            </div>
            <p className="text-[13px] text-[var(--text-3)] mt-0.5">
              {cotizacion.clientes?.nombre ?? 'Sin cliente'} -{' '}
              {new Date(cotizacion.created_at).toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <CambiarEstadoBombeo cotizacionId={cotizacion.id} estadoActual={cotizacion.estado} />
          <Button variant="secondary" size="sm" disabled>
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          {empresaConfig && (
            <BotonGenerarPDF
              tipo="bombeo"
              empresaId={empresaConfig.id}
              datos={{
                cotizacion: {
                  ...cotizacion,
                  clientes: cotizacion.clientes ?? null,
                },
                empresa: {
                  id: empresaConfig.id,
                  nombre_empresa: empresaConfig.nombre_empresa,
                  logo_url: empresaConfig.logo_url,
                  email: empresaConfig.email ?? null,
                  telefono: empresaConfig.telefono ?? null,
                  tasa_dolar: empresaConfig.tasa_dolar,
                },
              }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <ResumenTecnico cotizacion={cotizacion} />
          <IndicadorCaudal
            litrosDisponibles={cotizacion.litros_disponibles ?? 0}
            litrosRequeridos={cotizacion.litros_dia_requeridos}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <DesglosePrecio
            tipoSistema={cotizacion.tipo_sistema}
            soloLectura
            bombaDescripcion={cotizacion.bomba_marca ? `[${cotizacion.bomba_marca} ${cotizacion.bomba_modelo ?? ''}]` : undefined}
            panelDescripcion={cotizacion.panel_marca ? `[${cotizacion.panel_marca} ${cotizacion.panel_modelo ?? ''}]` : undefined}
            vfdDescripcion={cotizacion.vfd_marca ? `[${cotizacion.vfd_marca} ${cotizacion.vfd_modelo ?? ''}]` : undefined}
            valores={{
              bombaPrecio: cotizacion.bomba_precio ?? 0,
              panelPrecioUnit: cotizacion.panel_precio_unit ?? 0,
              panelCantidad: cotizacion.panel_cantidad ?? 0,
              vfdPrecio: cotizacion.vfd_precio ?? 0,
              instalacionUsd: cotizacion.instalacion_usd,
            }}
          />

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
              Resumen comercial
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Metric label="Total USD" value={formatearUSD(cotizacion.total_usd)} />
              <Metric label="Instalacion" value={formatearUSD(cotizacion.instalacion_usd)} />
              <Metric label="Estado" value={<EstadoBombeoBadge estado={cotizacion.estado} />} />
            </div>

            {cotizacion.notas && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
                  Notas
                </p>
                <p className="text-[13px] text-[var(--text-2)] leading-relaxed">{cotizacion.notas}</p>
              </div>
            )}
          </div>

          <SeccionCobro
            cotizacionId={cotizacion.id}
            tipo="bombeo"
            estadoCotizacion={cotizacion.estado}
            planExistente={planCobro.data ?? null}
          />
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
        {label}
      </p>
      <div className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--text)]">
        {value}
      </div>
    </div>
  )
}
