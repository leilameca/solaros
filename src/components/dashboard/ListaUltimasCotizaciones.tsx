import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatearUSD } from '@/lib/calculos'
import { cn } from '@/lib/utils'
import type { CotizacionRecienteDashboard } from '@/types/dashboard'

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function obtenerVariantTipo(
  tipo: CotizacionRecienteDashboard['tipo']
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (tipo === 'solar') return 'warning'
  if (tipo === 'bombeo') return 'info'
  return 'default'
}

function obtenerLabelEstado(estado: string) {
  if (estado === 'en_instalacion') return 'En instalación'
  return estado.charAt(0).toUpperCase() + estado.slice(1)
}

function obtenerVariantEstado(
  estado: string
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (estado === 'aprobada' || estado === 'completada') return 'success'
  if (estado === 'enviada') return 'info'
  if (estado === 'en_instalacion') return 'warning'
  if (estado === 'rechazada') return 'danger'
  return 'default'
}

export function ListaUltimasCotizaciones({
  titulo,
  cotizaciones,
  mostrarMonto = true,
  descripcion,
}: {
  titulo: string
  cotizaciones: CotizacionRecienteDashboard[]
  mostrarMonto?: boolean
  descripcion?: string
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-4 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-medium text-[var(--text)] tracking-[-0.01em]">{titulo}</h2>
            {descripcion ? (
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">{descripcion}</p>
            ) : null}
          </div>
          <span className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)] bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-2 py-0.5">
            {cotizaciones.length}
          </span>
        </div>
      </div>

      {cotizaciones.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[13px] text-[var(--text-3)]">No hay cotizaciones recientes todavía.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-[110px_170px_minmax(0,1fr)_120px_120px_96px_24px] gap-3 px-4 py-2.5 border-b border-[var(--border)] text-[10px] text-[var(--text-3)] uppercase tracking-[0.08em] font-[family-name:var(--font-mono)]">
            <span>Tipo</span>
            <span>Número</span>
            <span>Cliente</span>
            {mostrarMonto ? <span>Monto</span> : <span>Fecha</span>}
            <span>Estado</span>
            {mostrarMonto ? <span>Fecha</span> : <span />}
            <span />
          </div>

          <div className="divide-y divide-[var(--border)]">
            {cotizaciones.map((cotizacion) => (
              <Link
                key={`${cotizacion.tipo}-${cotizacion.cotizacion_id}`}
                href={cotizacion.ruta}
                className="group block hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="md:hidden px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={obtenerVariantTipo(cotizacion.tipo)}>
                      {cotizacion.tipo_label}
                    </Badge>
                    <Badge variant={obtenerVariantEstado(cotizacion.estado)}>
                      {obtenerLabelEstado(cotizacion.estado)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--text)]">
                      {cotizacion.cliente_nombre}
                    </p>
                    <p className="text-[12px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mt-1">
                      {cotizacion.numero_cotizacion}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    {mostrarMonto ? (
                      <p className="text-[13px] font-[family-name:var(--font-mono)] text-[var(--text)]">
                        {formatearUSD(cotizacion.total_usd)}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p className="text-[11px] text-[var(--text-3)]">
                      {formatearFecha(cotizacion.created_at)}
                    </p>
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-[110px_170px_minmax(0,1fr)_120px_120px_96px_24px] gap-3 px-4 py-3 items-center">
                  <Badge variant={obtenerVariantTipo(cotizacion.tipo)}>
                    {cotizacion.tipo_label}
                  </Badge>
                  <span className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--text-2)] truncate">
                    {cotizacion.numero_cotizacion}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--text)] truncate">
                    {cotizacion.cliente_nombre}
                  </span>
                  {mostrarMonto ? (
                    <span className="text-[13px] font-[family-name:var(--font-mono)] text-[var(--text)]">
                      {formatearUSD(cotizacion.total_usd)}
                    </span>
                  ) : (
                    <span className="text-[12px] text-[var(--text-3)]">
                      {formatearFecha(cotizacion.created_at)}
                    </span>
                  )}
                  <Badge
                    className={cn('w-fit')}
                    variant={obtenerVariantEstado(cotizacion.estado)}
                  >
                    {obtenerLabelEstado(cotizacion.estado)}
                  </Badge>
                  {mostrarMonto ? (
                    <span className="text-[11px] text-[var(--text-3)]">
                      {formatearFecha(cotizacion.created_at)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
