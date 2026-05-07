'use client'

import { useState, useTransition } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PLANES_PREDEFINIDOS, calcularMontoCuota, validarPorcentajes } from '@/lib/cobros'
import { crearPlanPago } from '@/app/(dashboard)/cobros/actions'
import type { PlanTipo } from '@/types/cobros'

interface CuotaForm {
  tempId: string
  orden: number
  porcentaje: number | ''
  condicion: string
  fecha_limite: string
}

interface CotizacionInfo {
  id: string
  numero_cotizacion: string
  total_usd: number
  total_rd: number
  cliente_id: string | null
  cliente_nombre: string
  tipo: 'solar' | 'bombeo' | 'electrico'
}

interface Props {
  cotizacion: CotizacionInfo
  tasaDolar: number
}

export function WizardNuevoPlan({ cotizacion, tasaDolar }: Props) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanTipo | null>(null)
  const [cuotas, setCuotas] = useState<CuotaForm[]>([])
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function seleccionarPlan(planId: PlanTipo) {
    const plan = PLANES_PREDEFINIDOS.find((p) => p.id === planId)
    if (!plan) return
    setPlanSeleccionado(planId)
    if (planId === 'personalizado') {
      setCuotas([
        {
          tempId: crypto.randomUUID(),
          orden: 1,
          porcentaje: '',
          condicion: '',
          fecha_limite: '',
        },
      ])
    } else {
      setCuotas(
        plan.cuotas.map((c) => ({
          tempId: crypto.randomUUID(),
          orden: c.orden,
          porcentaje: c.porcentaje,
          condicion: c.condicion,
          fecha_limite: '',
        }))
      )
    }
  }

  function actualizarCuota(tempId: string, campo: keyof CuotaForm, valor: string | number) {
    setCuotas((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, [campo]: valor } : c))
    )
  }

  function agregarCuota() {
    setCuotas((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        orden: prev.length + 1,
        porcentaje: '',
        condicion: '',
        fecha_limite: '',
      },
    ])
  }

  function eliminarCuota(tempId: string) {
    setCuotas((prev) => {
      const filtradas = prev.filter((c) => c.tempId !== tempId)
      return filtradas.map((c, i) => ({ ...c, orden: i + 1 }))
    })
  }

  const porcentajes = cuotas.map((c) => Number(c.porcentaje) || 0)
  const totalPorcentaje = porcentajes.reduce((acc, p) => acc + p, 0)
  const porcentajeValido = validarPorcentajes(porcentajes)

  function avanzarPaso2() {
    if (!planSeleccionado) return
    setPaso(2)
  }

  function avanzarPaso3() {
    setError('')
    if (!porcentajeValido) {
      setError(
        `Los porcentajes suman ${totalPorcentaje.toFixed(2)}%. Deben sumar exactamente 100%.`
      )
      return
    }
    for (const c of cuotas) {
      if (!c.condicion.trim()) {
        setError('Todas las cuotas deben tener una condición de pago.')
        return
      }
    }
    setPaso(3)
  }

  function confirmarCreacion() {
    setError('')
    startTransition(async () => {
      const result = await crearPlanPago({
        cotizacion_id: cotizacion.id,
        cotizacion_tipo: cotizacion.tipo,
        numero_cotizacion: cotizacion.numero_cotizacion,
        cliente_id: cotizacion.cliente_id,
        cliente_nombre: cotizacion.cliente_nombre,
        total_usd: cotizacion.total_usd,
        total_rd: cotizacion.total_rd,
        plan_tipo: planSeleccionado!,
        notas: notas.trim() || undefined,
        cuotas: cuotas.map((c) => ({
          orden: c.orden,
          porcentaje: Number(c.porcentaje),
          monto_usd: calcularMontoCuota(cotizacion.total_usd, Number(c.porcentaje)),
          monto_rd: calcularMontoCuota(cotizacion.total_rd, Number(c.porcentaje)),
          condicion: c.condicion,
          fecha_limite: c.fecha_limite || null,
        })),
      })

      if (result?.error) {
        toast.error(result.error)
        setError(result.error)
      }
    })
  }

  const planDef = planSeleccionado ? PLANES_PREDEFINIDOS.find((p) => p.id === planSeleccionado) : null

  return (
    <div className="max-w-[680px]">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center h-7 w-7 rounded-full text-[12px] font-medium transition-colors',
                paso === n
                  ? 'bg-[var(--accent)] text-white'
                  : paso > n
                  ? 'bg-[var(--green)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]'
              )}
            >
              {paso > n ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            <span
              className={cn(
                'text-[12px] font-medium',
                paso === n ? 'text-[var(--text)]' : 'text-[var(--text-3)]'
              )}
            >
              {n === 1 ? 'Seleccionar plan' : n === 2 ? 'Configurar cuotas' : 'Confirmar'}
            </span>
            {n < 3 && <div className="h-px w-8 bg-[var(--border)]" />}
          </div>
        ))}
      </div>

      {/* PASO 1 — Seleccionar plan */}
      {paso === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANES_PREDEFINIDOS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => seleccionarPlan(plan.id)}
                className={cn(
                  'text-left p-4 rounded-[var(--radius)] border transition-all',
                  planSeleccionado === plan.id
                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] ring-1 ring-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-bd)] hover:bg-[var(--surface-2)]'
                )}
              >
                <p className="text-[13px] font-semibold text-[var(--text)]">{plan.nombre}</p>
                <p className="text-[12px] text-[var(--text-3)] mt-0.5">{plan.descripcion}</p>
                {plan.cuotas.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {plan.cuotas.map((c) => (
                      <span
                        key={c.orden}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-2)] font-[family-name:var(--font-mono)]"
                      >
                        {c.porcentaje}%
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="accent"
              size="md"
              onClick={avanzarPaso2}
              disabled={!planSeleccionado}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* PASO 2 — Configurar cuotas */}
      {paso === 2 && (
        <div className="space-y-5">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                {planDef?.nombre} — Total: {cotizacion.total_usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {cuotas.map((cuota, idx) => (
                <div
                  key={cuota.tempId}
                  className="grid grid-cols-1 sm:grid-cols-[60px_1fr_160px_36px] gap-3 items-end"
                >
                  {/* Porcentaje */}
                  <div>
                    <label className="text-[11px] text-[var(--text-3)] mb-1 block">%</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={cuota.porcentaje}
                      onChange={(e) =>
                        actualizarCuota(
                          cuota.tempId,
                          'porcentaje',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={planSeleccionado !== 'personalizado'}
                      className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-2 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
                    />
                  </div>

                  {/* Condición */}
                  <Input
                    label={idx === 0 ? 'Condición de pago' : undefined}
                    value={cuota.condicion}
                    onChange={(e) => actualizarCuota(cuota.tempId, 'condicion', e.target.value)}
                    placeholder="Al firmar contrato…"
                  />

                  {/* Fecha límite */}
                  <div>
                    {idx === 0 && (
                      <label className="text-[11px] text-[var(--text-3)] mb-1 block">
                        Fecha límite (opc.)
                      </label>
                    )}
                    <input
                      type="date"
                      value={cuota.fecha_limite}
                      onChange={(e) =>
                        actualizarCuota(cuota.tempId, 'fecha_limite', e.target.value)
                      }
                      className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  {/* Eliminar (solo en personalizado) */}
                  {planSeleccionado === 'personalizado' ? (
                    <button
                      type="button"
                      onClick={() => eliminarCuota(cuota.tempId)}
                      disabled={cuotas.length === 1}
                      className="flex items-center justify-center h-9 w-9 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-3)] hover:text-[var(--red)] hover:border-[var(--red)] transition-colors disabled:opacity-30 mt-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Preview monto */}
                  {Number(cuota.porcentaje) > 0 && (
                    <div className="sm:col-span-4 -mt-1">
                      <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                        ≈{' '}
                        {calcularMontoCuota(
                          cotizacion.total_usd,
                          Number(cuota.porcentaje)
                        ).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} USD
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {planSeleccionado === 'personalizado' && (
                <button
                  type="button"
                  onClick={agregarCuota}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--accent)] font-medium hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar cuota
                </button>
              )}

              {/* Validación porcentajes */}
              {!porcentajeValido && totalPorcentaje > 0 && (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  Los porcentajes suman {totalPorcentaje.toFixed(2)}%. Deben sumar exactamente 100%.
                </p>
              )}
              {porcentajeValido && totalPorcentaje > 0 && (
                <p className="text-[12px] text-[var(--green)] font-medium">
                  ✓ Los porcentajes suman 100%.
                </p>
              )}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-[11px] text-[var(--text-3)] mb-1 block">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Condiciones adicionales, acuerdos especiales…"
              rows={2}
              className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setPaso(1)}>
              Atrás
            </Button>
            <Button variant="accent" onClick={avanzarPaso3} disabled={!porcentajeValido}>
              Revisar plan
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3 — Confirmar */}
      {paso === 3 && (
        <div className="space-y-5">
          {/* Resumen proyecto */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
              Resumen del plan
            </p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[14px] font-medium text-[var(--text)]">
                  {cotizacion.cliente_nombre}
                </p>
                <p className="text-[12px] text-[var(--text-3)]">
                  {cotizacion.numero_cotizacion} · {planDef?.nombre}
                </p>
              </div>
              <div className="text-right">
                <p className="font-[family-name:var(--font-mono)] text-[16px] font-medium text-[var(--text)]">
                  {cotizacion.total_usd.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </p>
                <p className="text-[11px] text-[var(--text-3)]">
                  RD$ {cotizacion.total_rd.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de cuotas */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                Cuotas
              </p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {cuotas.map((cuota) => (
                <div key={cuota.tempId} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-[var(--text)]">
                      Cuota {cuota.orden} — {Number(cuota.porcentaje)}%
                    </p>
                    <p className="text-[12px] text-[var(--text-3)]">{cuota.condicion}</p>
                    {cuota.fecha_limite && (
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">
                        Vence: {new Date(cuota.fecha_limite).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--text)]">
                      {calcularMontoCuota(cotizacion.total_usd, Number(cuota.porcentaje)).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </p>
                    <p className="text-[11px] text-[var(--text-3)]">
                      RD${' '}
                      {calcularMontoCuota(cotizacion.total_rd, Number(cuota.porcentaje)).toLocaleString('es-DO', {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {notas && (
            <p className="text-[12px] text-[var(--text-2)] bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2">
              {notas}
            </p>
          )}

          {error && (
            <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setPaso(2)}>
              Atrás
            </Button>
            <Button
              variant="accent"
              size="md"
              loading={isPending}
              onClick={confirmarCreacion}
            >
              Crear plan de cobro
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
