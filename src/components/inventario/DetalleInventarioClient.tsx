'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronLeft, Clock3, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModalMovimiento } from '@/components/inventario/ModalMovimiento'
import {
  calcularMargenProducto,
  calcularPorcentajeStock,
  formatearFechaCorta,
  obtenerEspecificacionProducto,
  obtenerLabelCategoria,
} from '@/lib/inventario-presentacion'
import { formatearRD, formatearUSD } from '@/lib/calculos'
import type { MovimientoInventario, ProductoInventario } from '@/types/inventario'

function obtenerPrecioBase(producto: ProductoInventario) {
  return (
    producto.precio_venta_usd ??
    producto.precio_costo_usd ??
    producto.precio_unitario ??
    0
  )
}

function badgeMargen(margen: number | null) {
  if (margen === null) {
    return <Badge variant="default">Sin margen</Badge>
  }

  if (margen > 30) {
    return <Badge variant="success">Margen saludable</Badge>
  }

  if (margen >= 15) {
    return <Badge variant="warning">Margen medio</Badge>
  }

  return <Badge variant="danger">Margen bajo</Badge>
}

function badgeMovimiento(tipo: MovimientoInventario['tipo']) {
  if (tipo === 'entrada') return <Badge variant="success">Entrada</Badge>
  if (tipo === 'salida') return <Badge variant="danger">Salida</Badge>
  return <Badge variant="warning">Ajuste</Badge>
}

export function DetalleInventarioClient({
  productoInicial,
  movimientosIniciales,
  totalMovimientos,
  paginaActual,
  limitePorPagina,
}: {
  productoInicial: ProductoInventario
  movimientosIniciales: MovimientoInventario[]
  totalMovimientos: number
  paginaActual: number
  limitePorPagina: number
}) {
  const [producto, setProducto] = useState(productoInicial)
  const [movimientos, setMovimientos] = useState(movimientosIniciales)
  const margen = useMemo(() => calcularMargenProducto(producto), [producto])
  const porcentajeStock = calcularPorcentajeStock(producto.stock_actual, producto.stock_minimo)
  const totalPaginas = Math.max(1, Math.ceil(totalMovimientos / limitePorPagina))

  function aplicarMovimientoOptimista(payload: {
    temporalId: string
    stockAnterior: number
    stockActual: number
    movimiento: MovimientoInventario
  }) {
    setProducto((previo) => ({
      ...previo,
      stock_actual: payload.stockActual,
      stock: payload.stockActual,
      updated_at: new Date().toISOString(),
    }))

    if (paginaActual === 1) {
      setMovimientos((previo) => [payload.movimiento, ...previo].slice(0, limitePorPagina))
    }
  }

  function revertirMovimiento(payload: {
    temporalId: string
    stockAnterior: number
  }) {
    setProducto((previo) => ({
      ...previo,
      stock_actual: payload.stockAnterior,
      stock: payload.stockAnterior,
    }))
    setMovimientos((previo) => previo.filter((movimiento) => movimiento.id !== payload.temporalId))
  }

  function confirmarMovimiento(payload: {
    temporalId: string
    stockActual: number
    movimiento: MovimientoInventario
  }) {
    setProducto((previo) => ({
      ...previo,
      stock_actual: payload.stockActual,
      stock: payload.stockActual,
      updated_at: payload.movimiento.created_at,
    }))

    if (paginaActual === 1) {
      setMovimientos((previo) => {
        const sinTemporal = previo.filter((movimiento) => movimiento.id !== payload.temporalId)
        return [payload.movimiento, ...sinTemporal].slice(0, limitePorPagina)
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inventario"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            {producto.marca} {producto.modelo}
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            {obtenerLabelCategoria(producto.categoria)}
            {obtenerEspecificacionProducto(producto)
              ? ` · ${obtenerEspecificacionProducto(producto)}`
              : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
        <div className="space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
                  Estado del stock
                </p>
                <p className="text-[36px] font-[300] text-[var(--text)] tracking-[-0.03em] font-[family-name:var(--font-sans)]">
                  {producto.stock_actual}
                </p>
                <p className="text-[12px] text-[var(--text-3)] mt-1">
                  {producto.unidad} disponibles · minimo {producto.stock_minimo}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ModalMovimiento
                  productoId={producto.id}
                  tipo="entrada"
                  stockActual={producto.stock_actual}
                  stockMinimo={producto.stock_minimo}
                  unidad={producto.unidad}
                  triggerVariant="accent"
                  triggerLabel="Registrar entrada"
                  onMovimientoOptimista={aplicarMovimientoOptimista}
                  onMovimientoFallido={revertirMovimiento}
                  onMovimientoConfirmado={confirmarMovimiento}
                />
                <ModalMovimiento
                  productoId={producto.id}
                  tipo="salida"
                  stockActual={producto.stock_actual}
                  stockMinimo={producto.stock_minimo}
                  unidad={producto.unidad}
                  triggerVariant="destructive"
                  triggerLabel="Registrar salida"
                  onMovimientoOptimista={aplicarMovimientoOptimista}
                  onMovimientoFallido={revertirMovimiento}
                  onMovimientoConfirmado={confirmarMovimiento}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className={
                    producto.stock_actual <= producto.stock_minimo
                      ? 'h-full bg-[var(--red)] transition-all'
                      : 'h-full bg-[var(--green)] transition-all'
                  }
                  style={{ width: `${porcentajeStock}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-[var(--text-3)]">Actual vs minimo</span>
                <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">
                  {producto.stock_actual}/{producto.stock_minimo}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatoTecnico
              label="Precio costo"
              valor={producto.precio_costo_usd ? formatearUSD(producto.precio_costo_usd) : 'No definido'}
            />
            <DatoTecnico
              label="Precio venta"
              valor={formatearUSD(obtenerPrecioBase(producto))}
            />
            <DatoTecnico
              label="Precio RD$"
              valor={producto.precio_rd ? formatearRD(producto.precio_rd) : 'No definido'}
            />
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
              <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)] mb-2">
                Margen
              </p>
              <div className="flex items-center gap-3">
                <p className="text-[22px] font-[300] text-[var(--text)] tracking-[-0.03em]">
                  {margen === null ? '--' : `${margen}%`}
                </p>
                {badgeMargen(margen)}
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
              Datos tecnicos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <DatoLinea label="Marca" valor={producto.marca} />
              <DatoLinea label="Modelo" valor={producto.modelo} />
              <DatoLinea label="Categoria" valor={obtenerLabelCategoria(producto.categoria)} />
              <DatoLinea label="Unidad" valor={producto.unidad} />
              <DatoLinea label="Especificacion" valor={obtenerEspecificacionProducto(producto) || 'Sin especificacion'} />
              <DatoLinea label="Actualizado" valor={formatearFechaCorta(producto.updated_at)} />
            </div>
            {producto.descripcion ? (
              <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
                <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)] mb-1">
                  Descripcion
                </p>
                <p className="text-[13px] text-[var(--text-2)]">{producto.descripcion}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                Historial
              </p>
              <p className="text-[13px] text-[var(--text-3)]">
                {totalMovimientos} movimientos registrados
              </p>
            </div>
            <Clock3 className="h-4 w-4 text-[var(--text-3)]" />
          </div>

          <div className="mt-4 space-y-3">
            {movimientos.length === 0 ? (
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
                <div className="mx-auto h-9 w-9 rounded-full bg-[var(--surface)] flex items-center justify-center">
                  <Package className="h-4 w-4 text-[var(--text-3)]" />
                </div>
                <p className="text-[13px] text-[var(--text)] mt-3">Todavia no hay movimientos.</p>
              </div>
            ) : (
              movimientos.map((movimiento) => (
                <div
                  key={movimiento.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {badgeMovimiento(movimiento.tipo)}
                    <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                        {movimiento.cantidad} {producto.unidad}
                    </span>
                  </div>
                    <span className="text-[11px] text-[var(--text-3)]">
                      {formatearFechaCorta(movimiento.created_at)}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-2)] mt-2">
                    Stock resultante: <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">{movimiento.stock_despues}</span>
                  </p>
                  {movimiento.motivo ? (
                    <p className="text-[12px] text-[var(--text-2)] mt-1">{movimiento.motivo}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[var(--text-3)]">
                    <span>
                      Usuario: {movimiento.usuarios?.nombre ?? 'Equipo SolarOS'}
                    </span>
                    {movimiento.numero_cotizacion ? (
                      <span>
                        Cotizacion: <span className="font-[family-name:var(--font-mono)]">{movimiento.numero_cotizacion}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPaginas > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={paginaActual <= 1}
                onClick={() => {
                  if (paginaActual > 1) {
                    window.location.href = `/inventario/${producto.id}?page=${paginaActual - 1}`
                  }
                }}
              >
                Anterior
              </Button>
              <p className="text-[12px] text-[var(--text-3)]">
                Pagina {paginaActual} de {totalPaginas}
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={paginaActual >= totalPaginas}
                onClick={() => {
                  if (paginaActual < totalPaginas) {
                    window.location.href = `/inventario/${producto.id}?page=${paginaActual + 1}`
                  }
                }}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function DatoTecnico({
  label,
  valor,
}: {
  label: string
  valor: string
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)] mb-2">
        {label}
      </p>
      <p className="text-[22px] font-[300] text-[var(--text)] tracking-[-0.03em] font-[family-name:var(--font-sans)]">
        {valor}
      </p>
    </div>
  )
}

function DatoLinea({
  label,
  valor,
}: {
  label: string
  valor: string
}) {
  return (
    <div>
      <p className="text-[11px] text-[var(--text-3)]">{label}</p>
      <p className="text-[13px] text-[var(--text)] mt-1">{valor}</p>
    </div>
  )
}
