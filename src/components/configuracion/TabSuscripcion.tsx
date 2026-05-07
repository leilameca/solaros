'use client'

import { useState, useTransition } from 'react'
import { cambiarPlanSuscripcionEmpresa } from '@/app/(dashboard)/configuracion/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  capitalizarPlan,
  ETIQUETAS_ESTADO_SUSCRIPCION,
  formatearFechaLargaConfiguracion,
  formatearUSDConfiguracion,
  PLANES_SOLAR_OS,
} from '@/lib/configuracion'
import { cn } from '@/lib/utils'
import type {
  EmpresaConfiguracion,
  FeedbackConfiguracion,
  PlanSuscripcionEmpresa,
} from '@/types/configuracion'

const ORDEN_PLANES: PlanSuscripcionEmpresa[] = ['basico', 'pro', 'enterprise']

export function TabSuscripcion({
  empresa,
  onFeedback,
}: {
  empresa: EmpresaConfiguracion
  onFeedback: (feedback: FeedbackConfiguracion) => void
}) {
  const [planActual, setPlanActual] = useState<PlanSuscripcionEmpresa>(empresa.plan_actual)
  const [montoActual, setMontoActual] = useState<number | null>(empresa.suscripcion_monto_usd)
  const [planEnCambio, setPlanEnCambio] = useState<PlanSuscripcionEmpresa | null>(null)
  const [isPending, startTransition] = useTransition()

  const diasRestantes = empresa.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(empresa.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  const badgeVariant =
    empresa.suscripcion_estado === 'activa'
      ? 'success'
      : empresa.suscripcion_estado === 'trial'
        ? 'warning'
        : 'danger'

  function seleccionarPlan(plan: PlanSuscripcionEmpresa) {
    if (plan === planActual || isPending) {
      return
    }

    const anteriorPlan = planActual
    const anteriorMonto = montoActual
    const nuevoMonto = PLANES_SOLAR_OS[plan].precioUsd

    setPlanEnCambio(plan)
    setPlanActual(plan)
    setMontoActual(nuevoMonto)

    startTransition(async () => {
      const resultado = await cambiarPlanSuscripcionEmpresa({ plan_actual: plan })

      if (resultado.error) {
        setPlanActual(anteriorPlan)
        setMontoActual(anteriorMonto)
        setPlanEnCambio(null)
        onFeedback({ type: 'error', message: resultado.error })
        return
      }

      setPlanActual(resultado.plan_actual ?? plan)
      setMontoActual(resultado.suscripcion_monto_usd ?? nuevoMonto)
      setPlanEnCambio(null)
      onFeedback({
        type: 'success',
        message: resultado.message ?? `Plan cambiado a ${capitalizarPlan(plan)}.`,
      })
    })
  }

  return (
    <div className="space-y-4">
      {empresa.suscripcion_estado === 'trial' ? (
        <div className="bg-[var(--accent-bg)] border border-[var(--accent-bd)] rounded-[var(--radius)] p-4">
          <p className="text-[13px] font-medium text-[var(--accent)]">
            Periodo de prueba - {diasRestantes} dias restantes
          </p>
          <p className="text-[12px] text-[var(--text-2)] mt-1">
            Todos los planes incluyen 3 meses gratis. Puedes elegir tu plan desde ahora y el trial sigue activo hasta el {formatearFechaLargaConfiguracion(empresa.trial_ends_at)}.
          </p>
        </div>
      ) : null}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
              Plan actual
            </p>
            <p className="text-[24px] font-[500] text-[var(--text)] mt-1">
              {capitalizarPlan(planActual)}
            </p>
          </div>
          <Badge variant={badgeVariant}>{ETIQUETAS_ESTADO_SUSCRIPCION[empresa.suscripcion_estado]}</Badge>
        </div>

        <p className="text-[13px] text-[var(--text-2)] mt-3">
          {empresa.suscripcion_renueva_en
            ? `Proximo cobro: ${formatearFechaLargaConfiguracion(empresa.suscripcion_renueva_en)} - ${formatearUSDConfiguracion(montoActual)} USD`
            : `Monto de referencia: ${formatearUSDConfiguracion(montoActual)} USD · plan ${capitalizarPlan(planActual)}`}
        </p>

        <p className="text-[12px] text-[var(--text-3)] mt-3">
          Mientras cerramos la facturacion automatica con Stripe, el admin puede cambiar el plan desde aqui y el acceso del producto se actualiza al instante.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {ORDEN_PLANES.map((plan) => {
          const detalle = PLANES_SOLAR_OS[plan]
          const seleccionado = planActual === plan

          return (
            <div
              key={plan}
              className={cn(
                'bg-[var(--surface)] border rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors',
                seleccionado
                  ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                  : 'border-[var(--border)]'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
                    {capitalizarPlan(plan)}
                  </p>
                  <p className="mt-2 text-[28px] font-[300] text-[var(--text)] tracking-[-0.03em]">
                    {formatearUSDConfiguracion(detalle.precioUsd)}
                  </p>
                  <p className="text-[12px] text-[var(--text-3)] mt-1">por mes despues del trial</p>
                </div>
                {seleccionado ? <Badge variant="warning">Actual</Badge> : null}
              </div>

              <div className="mt-4 space-y-2 text-[13px] text-[var(--text)]">
                <PlanFeature label="Usuarios" value={detalle.usuarios} />
                <PlanFeature label="Cotizaciones/mes" value={detalle.cotizacionesMes} />
                <PlanFeature label="Propuestas PDF/mes" value={detalle.propuestasMes} />
                <PlanFeature label="Modulo bombeo" value={detalle.incluyeBombeo} />
                <PlanFeature label="Inventario" value={detalle.incluyeInventario} />
                <PlanFeature label="Soporte" value={detalle.soporte} />
              </div>

              <Button
                type="button"
                variant={seleccionado ? 'secondary' : 'accent'}
                className="mt-5 w-full"
                onClick={() => seleccionarPlan(plan)}
                disabled={seleccionado || isPending}
                loading={isPending && planEnCambio === plan}
              >
                {seleccionado ? 'Plan actual' : `Cambiar a ${capitalizarPlan(plan)}`}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlanFeature({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
      <span className="text-[var(--text-2)]">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
