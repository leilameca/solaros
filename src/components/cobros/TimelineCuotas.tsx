'use client'

import { AlertCircle, CheckCircle2, Circle, Clock } from 'lucide-react'
import { formatearMetodoPago, diasVencida, diasParaVencer } from '@/lib/cobros'
import { ModalRegistrarPago } from '@/components/cobros/ModalRegistrarPago'
import type { CuotaPago } from '@/types/cobros'

interface Props {
  cuotas: CuotaPago[]
  planId: string
  empresaId: string
  totalUsd: number
}

export function TimelineCuotas({ cuotas, planId, empresaId, totalUsd }: Props) {
  const ordenadas = [...cuotas].sort((a, b) => a.orden - b.orden)

  return (
    <div className="space-y-1">
      {ordenadas.map((cuota, idx) => {
        const esPagada = cuota.estado === 'pagado'
        const esVencida = cuota.estado === 'vencido'
        const esPendiente = cuota.estado === 'pendiente'
        const esProxima =
          esPendiente &&
          cuota.fecha_limite != null &&
          diasParaVencer(cuota.fecha_limite) <= 7 &&
          diasParaVencer(cuota.fecha_limite) >= 0
        const esUltima = idx === ordenadas.length - 1

        return (
          <div key={cuota.id} className="flex gap-4">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${
                  esPagada
                    ? 'bg-[var(--green-bg)] text-[var(--green)]'
                    : esVencida
                    ? 'bg-[var(--red-bg)] text-[var(--red)]'
                    : esProxima
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-3)]'
                }`}
              >
                {esPagada ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : esVencida ? (
                  <AlertCircle className="h-4 w-4" />
                ) : esProxima ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {!esUltima && (
                <div
                  className={`w-px flex-1 mt-1 mb-1 ${
                    esPagada ? 'bg-[var(--green)]/20' : 'bg-[var(--border)]'
                  }`}
                  style={{ minHeight: '20px' }}
                />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-5 ${esUltima ? 'pb-0' : ''}`}>
              <div
                className={`rounded-[var(--radius)] border p-4 ${
                  esPagada
                    ? 'border-[var(--green)]/20 bg-[var(--green-bg)]'
                    : esVencida
                    ? 'border-[var(--red)]/20 bg-[var(--red-bg)]'
                    : esProxima
                    ? 'border-[var(--accent-bd)] bg-[var(--accent-bg)]'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-[var(--text)]">
                        Cuota {cuota.orden} —{' '}
                        {cuota.monto_usd.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </p>
                      <span
                        className={`text-[11px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded-sm ${
                          esPagada
                            ? 'bg-[var(--green)]/10 text-[var(--green)]'
                            : esVencida
                            ? 'bg-[var(--red)]/10 text-[var(--red)]'
                            : 'bg-[var(--surface-2)] text-[var(--text-3)]'
                        }`}
                      >
                        {cuota.porcentaje}%
                      </span>
                    </div>

                    <p className="text-[12px] text-[var(--text-2)] mt-0.5">{cuota.condicion}</p>

                    {/* Estado y fechas */}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                      {cuota.fecha_limite && !esPagada && (
                        <p
                          className={`text-[11px] font-medium ${
                            esVencida
                              ? 'text-[var(--red)]'
                              : esProxima
                              ? 'text-[var(--accent)]'
                              : 'text-[var(--text-3)]'
                          }`}
                        >
                          {esVencida
                            ? `Venció hace ${diasVencida(cuota.fecha_limite)} día${diasVencida(cuota.fecha_limite) !== 1 ? 's' : ''}`
                            : esProxima
                            ? `Vence en ${diasParaVencer(cuota.fecha_limite)} día${diasParaVencer(cuota.fecha_limite) !== 1 ? 's' : ''}`
                            : `Vence: ${new Date(cuota.fecha_limite).toLocaleDateString('es-DO', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}`}
                        </p>
                      )}

                      {esPagada && cuota.fecha_pago && (
                        <p className="text-[11px] text-[var(--green)] font-medium">
                          Pagado el{' '}
                          {new Date(cuota.fecha_pago).toLocaleDateString('es-DO', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}

                      {esPagada && cuota.metodo_pago && (
                        <p className="text-[11px] text-[var(--text-3)]">
                          {formatearMetodoPago(cuota.metodo_pago)}
                          {cuota.referencia_pago ? ` · ${cuota.referencia_pago}` : ''}
                        </p>
                      )}

                      {esPagada && cuota.monto_recibido_usd != null && cuota.monto_recibido_usd !== cuota.monto_usd && (
                        <p className="text-[11px] text-[var(--text-3)]">
                          Recibido:{' '}
                          {cuota.monto_recibido_usd.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </p>
                      )}
                    </div>

                    {cuota.notas_pago && (
                      <p className="text-[11px] text-[var(--text-3)] mt-1 italic">{cuota.notas_pago}</p>
                    )}
                  </div>

                  {/* Acción */}
                  {(esPendiente || esVencida) && (
                    <div className="flex-shrink-0">
                      <ModalRegistrarPago
                        cuotaId={cuota.id}
                        planId={planId}
                        empresaId={empresaId}
                        montoUsd={cuota.monto_usd}
                        condicion={cuota.condicion}
                        orden={cuota.orden}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
