import Link from 'next/link'
import { ArrowRight, CreditCard } from 'lucide-react'

interface PlanResumen {
  id: string
  estado: string
  plan_pago_cuotas: { porcentaje: number; estado: string }[]
}

interface Props {
  cotizacionId: string
  tipo: 'solar' | 'bombeo' | 'electrico'
  estadoCotizacion: string
  planExistente: PlanResumen | null
}

export function SeccionCobro({ cotizacionId, tipo, estadoCotizacion, planExistente }: Props) {
  const estaAprobada = ['aprobada', 'aprobado', 'en_instalacion', 'completada'].includes(
    estadoCotizacion
  )

  if (!estaAprobada) return null

  if (planExistente) {
    const cuotas = planExistente.plan_pago_cuotas ?? []
    const porcentajeCobrado = cuotas
      .filter((c) => c.estado === 'pagado')
      .reduce((acc, c) => acc + c.porcentaje, 0)

    const porcentajePendiente = cuotas
      .filter((c) => c.estado === 'pendiente' || c.estado === 'vencido')
      .reduce((acc, c) => acc + c.porcentaje, 0)

    const tieneVencidas = cuotas.some((c) => c.estado === 'vencido')

    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
            Plan de cobro
          </p>
        </div>
        <div className="p-4 space-y-3">
          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[12px] text-[var(--text-2)]">
                {porcentajeCobrado.toFixed(0)}% cobrado
              </p>
              {tieneVencidas && (
                <span className="text-[11px] font-medium text-[var(--red)]">Cuotas vencidas</span>
              )}
            </div>
            <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(porcentajeCobrado, 100)}%`,
                  backgroundColor:
                    porcentajeCobrado >= 100
                      ? 'var(--green)'
                      : tieneVencidas
                      ? 'var(--red)'
                      : 'var(--accent)',
                }}
              />
            </div>
            {porcentajePendiente > 0 && (
              <p className="text-[11px] text-[var(--text-3)] mt-1">
                {porcentajePendiente.toFixed(0)}% pendiente por cobrar
              </p>
            )}
          </div>

          <Link
            href={`/cobros/${planExistente.id}`}
            className="flex items-center justify-between gap-2 text-[12px] font-medium text-[var(--accent)] hover:underline"
          >
            Ver detalle del plan
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)] flex-shrink-0">
          <CreditCard className="h-4 w-4 text-[var(--text-3)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--text)]">Sin plan de cobro</p>
          <p className="text-[12px] text-[var(--text-3)] mt-0.5">
            Define cómo y cuándo cobrar este proyecto.
          </p>
          <Link
            href={`/cobros/nuevo?cotizacion_id=${cotizacionId}&tipo=${tipo}`}
            className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-medium text-[var(--accent)] hover:underline"
          >
            Crear plan de cobro
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
