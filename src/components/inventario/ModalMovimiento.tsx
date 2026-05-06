'use client'

import { startTransition, useMemo, useState, useTransition } from 'react'
import { ArrowDownLeft, ArrowUpRight, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { registrarMovimientoInventario } from '@/app/(dashboard)/inventario/actions'
import type { MovimientoInventario, TipoMovimientoInventario } from '@/types/inventario'

interface MovimientoOptimista {
  temporalId: string
  stockAnterior: number
  stockActual: number
  movimiento: MovimientoInventario
}

function numeroSeguro(valor: number | '' | null | undefined) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
}

export function ModalMovimiento({
  productoId,
  tipo,
  stockActual,
  stockMinimo,
  unidad,
  triggerLabel,
  triggerVariant = 'secondary',
  onMovimientoOptimista,
  onMovimientoConfirmado,
  onMovimientoFallido,
}: {
  productoId: string
  tipo: Exclude<TipoMovimientoInventario, 'ajuste'>
  stockActual: number
  stockMinimo: number
  unidad: string
  triggerLabel?: string
  triggerVariant?: 'accent' | 'secondary' | 'destructive'
  onMovimientoOptimista?: (payload: MovimientoOptimista) => void
  onMovimientoConfirmado?: (payload: { temporalId: string; stockActual: number; movimiento: MovimientoInventario }) => void
  onMovimientoFallido?: (payload: MovimientoOptimista) => void
}) {
  const [open, setOpen] = useState(false)
  const [cantidad, setCantidad] = useState<number | ''>('')
  const [motivo, setMotivo] = useState('')
  const [numeroCotizacion, setNumeroCotizacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startSaving] = useTransition()

  const cantidadNumerica = numeroSeguro(cantidad)
  const stockProyectado =
    tipo === 'entrada'
      ? stockActual + cantidadNumerica
      : stockActual - cantidadNumerica

  const salidaBajaStock =
    tipo === 'salida' &&
    cantidadNumerica > 0 &&
    stockProyectado <= stockMinimo

  const icono = tipo === 'entrada' ? ArrowUpRight : ArrowDownLeft
  const Icono = icono

  const titulo = tipo === 'entrada' ? 'Registrar entrada' : 'Registrar salida'
  const textoBoton = triggerLabel ?? titulo

  const descripcion = useMemo(() => {
    if (tipo === 'entrada') {
      return 'Registra compra, devolucion o ajuste positivo.'
    }

    return 'Registra una salida por instalacion, reserva o consumo interno.'
  }, [tipo])

  function resetear() {
    setCantidad('')
    setMotivo('')
    setNumeroCotizacion('')
    setError(null)
  }

  function manejarCerrar() {
    if (isPending) return
    setOpen(false)
    resetear()
  }

  function construirMovimientoOptimista() {
    const temporalId = `tmp-${Date.now()}`
    const ahora = new Date().toISOString()

    return {
      temporalId,
      stockAnterior: stockActual,
      stockActual: stockProyectado,
      movimiento: {
        id: temporalId,
        empresa_id: 'optimista',
        producto_id: productoId,
        tipo,
        cantidad: cantidadNumerica,
        stock_antes: stockActual,
        stock_despues: stockProyectado,
        motivo: motivo.trim() || null,
        cotizacion_id: null,
        numero_cotizacion: numeroCotizacion.trim() || null,
        precio_unit_usd: null,
        created_at: ahora,
        created_by: null,
        usuarios: null,
      },
    } satisfies MovimientoOptimista
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (cantidadNumerica <= 0) {
      setError('La cantidad debe ser mayor que cero.')
      return
    }

    if (tipo === 'salida' && stockProyectado < 0) {
      setError('No puedes sacar mas unidades de las disponibles.')
      return
    }

    const movimientoOptimista = construirMovimientoOptimista()
    onMovimientoOptimista?.(movimientoOptimista)

    startSaving(async () => {
      const respuesta = await registrarMovimientoInventario({
        producto_id: productoId,
        tipo,
        cantidad: cantidadNumerica,
        motivo,
        numero_cotizacion: numeroCotizacion || null,
      })

      if (respuesta?.error) {
        onMovimientoFallido?.(movimientoOptimista)
        setError(respuesta.error)
        return
      }

      onMovimientoConfirmado?.({
        temporalId: movimientoOptimista.temporalId,
        stockActual: respuesta?.stock_actual ?? movimientoOptimista.stockActual,
        movimiento: respuesta?.movimiento ?? movimientoOptimista.movimiento,
      })

      startTransition(() => {
        setOpen(false)
        resetear()
      })
    })
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Icono className="h-3.5 w-3.5" />
        {textoBoton}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/30 px-4 py-6 sm:flex sm:items-center sm:justify-center">
          <div className="absolute inset-0" onClick={manejarCerrar} />
          <div className="relative ml-auto mr-auto mt-auto sm:mt-0 w-full max-w-[480px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4">
              <div>
                <p className="text-[18px] font-medium text-[var(--text)] tracking-[-0.02em]">
                  {titulo}
                </p>
                <p className="text-[12px] text-[var(--text-3)] mt-1">{descripcion}</p>
              </div>
              <button
                type="button"
                onClick={manejarCerrar}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-3)] hover:bg-[var(--surface-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 px-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={`Cantidad (${unidad})`}
                  type="number"
                  min={1}
                  step="1"
                  value={cantidad}
                  onChange={(event) =>
                    setCantidad(event.target.value === '' ? '' : Number(event.target.value))
                  }
                />
                <Input
                  label="Numero de cotizacion"
                  placeholder="Opcional"
                  value={numeroCotizacion}
                  onChange={(event) => setNumeroCotizacion(event.target.value)}
                />
              </div>

              <Textarea
                label="Motivo"
                rows={3}
                placeholder={tipo === 'entrada' ? 'Compra proveedor, devolucion, ajuste...' : 'Instalacion, garantia, reserva...'}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
              />

              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-[var(--text-3)]">Stock actual</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">
                    {stockActual} {unidad}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px] mt-2">
                  <span className="text-[var(--text-3)]">Stock proyectado</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">
                    {stockProyectado} {unidad}
                  </span>
                </div>
              </div>

              {salidaBajaStock ? (
                <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-start gap-2">
                    <TriangleAlert className="h-4 w-4 text-[var(--red)] mt-0.5" />
                    <div>
                      <p className="text-[13px] text-[var(--red)] font-medium">
                        Stock bajo despues de la salida
                      </p>
                      <p className="text-[12px] text-[var(--red)] mt-1">
                        El producto quedara en {stockProyectado} {unidad} y su minimo es {stockMinimo}.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius-sm)] p-3">
                  <p className="text-[12px] text-[var(--red)]">{error}</p>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={manejarCerrar}>
                  Cancelar
                </Button>
                <Button type="submit" variant={tipo === 'entrada' ? 'accent' : 'destructive'} loading={isPending}>
                  {titulo}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
