import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatearUSD } from '@/lib/calculos'
import type { HistorialCotizacionCliente } from '@/types/clientes'

function BadgeTipo({ tipo }: { tipo: HistorialCotizacionCliente['tipo'] }) {
  if (tipo === 'solar') {
    return <Badge variant="warning">Solar</Badge>
  }
  if (tipo === 'bombeo') {
    return <Badge variant="info">Bombeo</Badge>
  }
  return <Badge variant="default">Electrico</Badge>
}

function BadgeEstadoComun({ estado }: { estado: string }) {
  const variant =
    estado === 'aprobada' || estado === 'completada'
      ? 'success'
      : estado === 'rechazada'
      ? 'danger'
      : estado === 'enviada' || estado === 'cotizado'
      ? 'info'
      : estado === 'en_instalacion' || estado === 'negociando'
      ? 'warning'
      : 'default'

  return <Badge variant={variant}>{estado.replaceAll('_', ' ')}</Badge>
}

export function HistorialCotizaciones({
  items,
}: {
  items: HistorialCotizacionCliente[]
}) {
  if (items.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[13px] text-[var(--text-3)]">
          Este cliente aun no tiene cotizaciones asociadas.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="divide-y divide-[var(--border)]">
        {items.map((item) => (
          <Link
            key={`${item.tipo}-${item.cotizacion_id}`}
            href={item.ruta}
            className="block hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <BadgeTipo tipo={item.tipo} />
                  <span className="font-[family-name:var(--font-mono)] text-[12px] font-medium text-[var(--text)]">
                    {item.numero_cotizacion}
                  </span>
                  <BadgeEstadoComun estado={item.estado} />
                </div>
                <p className="text-[12px] text-[var(--text-3)] mt-2">
                  {new Date(item.created_at).toLocaleDateString('es-DO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <p className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--text)] sm:text-right">
                {formatearUSD(item.total_usd)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
