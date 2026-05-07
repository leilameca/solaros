import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { formatearUSD } from '@/lib/calculos'
import { TimelineCuotas } from '@/components/cobros/TimelineCuotas'
import type { PlanPago, CuotaPago, EstadoPlan } from '@/types/cobros'

export default async function DetallePlanPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) redirect('/configuracion')

  const { data, error } = await supabase
    .from('planes_pago')
    .select('*, plan_pago_cuotas(*)')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const plan = data as unknown as PlanPago

  const cuotas = [...(plan.plan_pago_cuotas ?? [])].sort((a, b) => a.orden - b.orden)

  const porcentajeCobrado = cuotas
    .filter((c) => c.estado === 'pagado')
    .reduce((acc, c) => acc + c.porcentaje, 0)

  const montoCobrado = cuotas
    .filter((c: CuotaPago) => c.estado === 'pagado')
    .reduce((acc: number, c: CuotaPago) => acc + (c.monto_recibido_usd ?? c.monto_usd), 0)

  const cuotasPendientes = cuotas.filter(
    (c: CuotaPago) => c.estado === 'pendiente' || c.estado === 'vencido'
  ).length

  const hrefCotizacion =
    plan.cotizacion_tipo === 'solar'
      ? `/cotizaciones/${plan.cotizacion_id}`
      : plan.cotizacion_tipo === 'bombeo'
      ? `/bombeo/${plan.cotizacion_id}`
      : `/electrico/${plan.cotizacion_id}`

  const estadoLabel: Record<EstadoPlan, string> = {
    activo: 'Activo',
    completado: 'Completado',
    cancelado: 'Cancelado',
  }
  const estadoClase: Record<EstadoPlan, string> = {
    activo: 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-bd)]',
    completado: 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green)]/20',
    cancelado: 'bg-[var(--surface-2)] text-[var(--text-3)] border-[var(--border-s)]',
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/cobros"
            className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
                {plan.cliente_nombre}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${estadoClase[plan.estado]}`}
              >
                {estadoLabel[plan.estado]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[13px] text-[var(--text-3)]">{plan.numero_cotizacion}</p>
              <span className="text-[var(--text-3)]">·</span>
              <Link
                href={hrefCotizacion}
                className="text-[13px] text-[var(--accent)] hover:underline"
              >
                Ver cotización →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda — Resumen */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card resumen financiero */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
                Total del proyecto
              </p>
              <p className="font-[family-name:var(--font-mono)] text-[28px] font-[300] text-[var(--text)] tracking-[-0.03em]">
                {formatearUSD(plan.total_usd)}
              </p>
              {plan.total_rd && (
                <p className="text-[12px] text-[var(--text-3)] mt-0.5">
                  RD$ {plan.total_rd.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>

            {/* Barra de progreso */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] text-[var(--text-3)]">Progreso del cobro</p>
                <p className="text-[11px] font-medium text-[var(--text)] font-[family-name:var(--font-mono)]">
                  {porcentajeCobrado.toFixed(0)}%
                </p>
              </div>
              <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(porcentajeCobrado, 100)}%`,
                    backgroundColor:
                      porcentajeCobrado >= 100 ? 'var(--green)' : 'var(--accent)',
                  }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-3)] mt-1.5">
                {formatearUSD(montoCobrado)} cobrado de {formatearUSD(plan.total_usd)}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
              <div>
                <p className="text-[10px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
                  Cuotas
                </p>
                <p className="text-[20px] font-[300] text-[var(--text)] tracking-[-0.03em] mt-1">
                  {cuotas.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
                  Pendientes
                </p>
                <p
                  className={`text-[20px] font-[300] tracking-[-0.03em] mt-1 ${
                    cuotasPendientes > 0 ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                  }`}
                >
                  {cuotasPendientes}
                </p>
              </div>
            </div>
          </div>

          {/* Info del plan */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
              Detalles
            </p>
            <div className="space-y-2">
              <Fila label="Tipo de plan" valor={plan.plan_tipo.replace(/_/g, '/')} />
              <Fila
                label="Creado"
                valor={new Date(plan.created_at).toLocaleDateString('es-DO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <Fila
                label="Tipo cotización"
                valor={
                  plan.cotizacion_tipo === 'solar'
                    ? 'Solar'
                    : plan.cotizacion_tipo === 'bombeo'
                    ? 'Bombeo'
                    : 'Eléctrico'
                }
              />
            </div>
            {plan.notas && (
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <p className="text-[11px] text-[var(--text-3)] mb-1">Notas</p>
                <p className="text-[12px] text-[var(--text-2)] leading-relaxed">{plan.notas}</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha — Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-5">
              Cuotas del plan
            </p>
            <TimelineCuotas
              cuotas={cuotas}
              planId={plan.id}
              empresaId={plan.empresa_id}
              totalUsd={plan.total_usd}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[12px] text-[var(--text-3)] flex-shrink-0">{label}</span>
      <span className="text-[12px] text-[var(--text)] font-medium text-right capitalize">
        {valor}
      </span>
    </div>
  )
}
