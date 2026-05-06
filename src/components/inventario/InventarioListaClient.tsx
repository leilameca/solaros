'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Package, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertaStockBajo } from '@/components/inventario/AlertaStockBajo'
import { ModalMovimiento } from '@/components/inventario/ModalMovimiento'
import {
  CATEGORIAS_TAB,
  categoriaPerteneceATab,
  formatearFechaCorta,
  obtenerEspecificacionProducto,
  obtenerLabelCategoria,
} from '@/lib/inventario-presentacion'
import { formatearUSD } from '@/lib/calculos'
import type { CategoriaTabInventario, ProductoInventario } from '@/types/inventario'

function obtenerPrecioBase(producto: ProductoInventario) {
  return (
    producto.precio_venta_usd ??
    producto.precio_costo_usd ??
    producto.precio_unitario ??
    0
  )
}

function normalizarBusqueda(texto: string) {
  return texto.trim().toLowerCase()
}

function calcularMetricas(productos: ProductoInventario[]) {
  const activos = productos.filter((producto) => producto.activo)

  return activos.reduce(
    (acumulado, producto) => {
      acumulado.total += 1
      if (producto.stock_actual <= producto.stock_minimo) {
        acumulado.stockBajo += 1
        acumulado.productosStockBajo.push({
          id: producto.id,
          marca: producto.marca,
          modelo: producto.modelo,
          categoria: producto.categoria,
          stock_actual: producto.stock_actual,
          stock_minimo: producto.stock_minimo,
          unidad: producto.unidad,
        })
      }
      acumulado.valorTotal += producto.stock_actual * obtenerPrecioBase(producto)
      return acumulado
    },
    {
      total: 0,
      stockBajo: 0,
      valorTotal: 0,
      productosStockBajo: [] as Array<{
        id: string
        marca: string
        modelo: string
        categoria: ProductoInventario['categoria']
        stock_actual: number
        stock_minimo: number
        unidad: string
      }>,
    }
  )
}

export function InventarioListaClient({
  productosIniciales,
  filtroInicialStockBajo = false,
}: {
  productosIniciales: ProductoInventario[]
  filtroInicialStockBajo?: boolean
}) {
  const router = useRouter()
  const [productos, setProductos] = useState(productosIniciales)
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaTabInventario>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [soloStockBajo, setSoloStockBajo] = useState(filtroInicialStockBajo)
  const busquedaDiferida = useDeferredValue(busqueda)

  const metricas = useMemo(() => calcularMetricas(productos), [productos])

  const productosFiltrados = useMemo(() => {
    const termino = normalizarBusqueda(busquedaDiferida)

    return productos.filter((producto) => {
      if (!producto.activo) return false
      if (!categoriaPerteneceATab(producto.categoria, categoriaActiva)) return false
      if (soloStockBajo && producto.stock_actual > producto.stock_minimo) return false
      if (!termino) return true

      return `${producto.marca} ${producto.modelo}`.toLowerCase().includes(termino)
    })
  }, [busquedaDiferida, categoriaActiva, productos, soloStockBajo])

  function actualizarStockProducto(productoId: string, stockActual: number) {
    setProductos((previo) =>
      previo.map((producto) =>
        producto.id === productoId
          ? {
              ...producto,
              stock_actual: stockActual,
              stock: stockActual,
              updated_at: new Date().toISOString(),
            }
          : producto
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Inventario
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-1">
            Controla stock, registra entradas y salidas, y revisa alertas antes de cotizar.
          </p>
        </div>
        <Link href="/inventario/nuevo">
          <Button variant="accent">
            <Plus className="h-3.5 w-3.5" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricaInventario
          label="Productos activos"
          valor={metricas.total.toString()}
          descripcion="Items disponibles para ventas e instalaciones"
        />
        <MetricaInventario
          label="Stock bajo"
          valor={metricas.stockBajo.toString()}
          descripcion="Productos que necesitan reposicion"
          valorClassName={metricas.stockBajo > 0 ? 'text-[var(--red)]' : undefined}
        />
        <MetricaInventario
          label="Valor inventario USD"
          valor={formatearUSD(metricas.valorTotal)}
          descripcion="Calculado con precio de venta o costo"
        />
      </div>

      <AlertaStockBajo productos={metricas.productosStockBajo} />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            {CATEGORIAS_TAB.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setCategoriaActiva(tab.value)}
                className={
                  categoriaActiva === tab.value
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-bd)] rounded-full px-3 py-1.5 text-[12px] font-medium'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] rounded-full px-3 py-1.5 text-[12px] font-medium'
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-3)]" />
            <Input
              className="pl-9"
              placeholder="Buscar por marca o modelo"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setSoloStockBajo((previo) => !previo)}
            className={
              soloStockBajo
                ? 'bg-[var(--red-bg)] text-[var(--red)] border border-[var(--red)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium'
                : 'bg-transparent text-[var(--text)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--surface-2)] transition-colors'
            }
          >
            {soloStockBajo ? 'Mostrando stock bajo' : 'Solo stock bajo'}
          </button>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {productosFiltrados.length === 0 ? (
          <EstadoVacio />
        ) : (
          productosFiltrados.map((producto) => (
            <div
              key={producto.id}
              onClick={() => router.push(`/inventario/${producto.id}`)}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-[var(--text)]">
                    {producto.marca} {producto.modelo}
                  </p>
                  <p className="text-[12px] text-[var(--text-3)] mt-1">
                    {obtenerLabelCategoria(producto.categoria)}
                    {obtenerEspecificacionProducto(producto)
                      ? ` · ${obtenerEspecificacionProducto(producto)}`
                      : ''}
                  </p>
                </div>
                <EstadoStock producto={producto} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DatoCard label="Stock" valor={`${producto.stock_actual} ${producto.unidad}`} />
                <DatoCard
                  label="Precio venta"
                  valor={formatearUSD(obtenerPrecioBase(producto))}
                />
              </div>

              <div className="flex items-center justify-between gap-2" onClick={(event) => event.stopPropagation()}>
                <div className="flex gap-2">
                  <ModalMovimiento
                    productoId={producto.id}
                    tipo="entrada"
                    stockActual={producto.stock_actual}
                    stockMinimo={producto.stock_minimo}
                    unidad={producto.unidad}
                    triggerVariant="accent"
                    triggerLabel="Entrada"
                    onMovimientoOptimista={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                    onMovimientoFallido={(payload) => actualizarStockProducto(producto.id, payload.stockAnterior)}
                    onMovimientoConfirmado={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                  />
                  <ModalMovimiento
                    productoId={producto.id}
                    tipo="salida"
                    stockActual={producto.stock_actual}
                    stockMinimo={producto.stock_minimo}
                    unidad={producto.unidad}
                    triggerVariant="destructive"
                    triggerLabel="Salida"
                    onMovimientoOptimista={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                    onMovimientoFallido={(payload) => actualizarStockProducto(producto.id, payload.stockAnterior)}
                    onMovimientoConfirmado={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                  />
                </div>
                <Link
                  href={`/inventario/${producto.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--text-2)]"
                >
                  Historial
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-[minmax(0,2.2fr)_120px_1fr_90px_90px_130px_220px] gap-3 px-4 py-3 border-b border-[var(--border)] text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
          <span>Producto</span>
          <span>Categoria</span>
          <span>Especificacion</span>
          <span>Stock</span>
          <span>Minimo</span>
          <span>Precio venta</span>
          <span>Acciones</span>
        </div>

        {productosFiltrados.length === 0 ? (
          <EstadoVacio className="p-8" />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                onClick={() => router.push(`/inventario/${producto.id}`)}
                className="grid grid-cols-[minmax(0,2.2fr)_120px_1fr_90px_90px_130px_220px] gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-[13px] font-medium text-[var(--text)]">
                    {producto.marca} {producto.modelo}
                  </p>
                  <p className="text-[11px] text-[var(--text-3)] mt-1">
                    Actualizado {formatearFechaCorta(producto.updated_at)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge variant="default">{obtenerLabelCategoria(producto.categoria)}</Badge>
                </div>
                <p className="text-[12px] text-[var(--text-2)] self-center">
                  {obtenerEspecificacionProducto(producto) || 'Sin especificacion'}
                </p>
                <div className="self-center">
                  <p className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                    {producto.stock_actual}
                  </p>
                  <EstadoStock producto={producto} compact />
                </div>
                <p className="self-center font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                  {producto.stock_minimo}
                </p>
                <p className="self-center font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                  {formatearUSD(obtenerPrecioBase(producto))}
                </p>
                <div className="flex items-center gap-2 self-center" onClick={(event) => event.stopPropagation()}>
                  <ModalMovimiento
                    productoId={producto.id}
                    tipo="entrada"
                    stockActual={producto.stock_actual}
                    stockMinimo={producto.stock_minimo}
                    unidad={producto.unidad}
                    triggerVariant="accent"
                    triggerLabel="Entrada"
                    onMovimientoOptimista={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                    onMovimientoFallido={(payload) => actualizarStockProducto(producto.id, payload.stockAnterior)}
                    onMovimientoConfirmado={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                  />
                  <ModalMovimiento
                    productoId={producto.id}
                    tipo="salida"
                    stockActual={producto.stock_actual}
                    stockMinimo={producto.stock_minimo}
                    unidad={producto.unidad}
                    triggerVariant="destructive"
                    triggerLabel="Salida"
                    onMovimientoOptimista={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                    onMovimientoFallido={(payload) => actualizarStockProducto(producto.id, payload.stockAnterior)}
                    onMovimientoConfirmado={(payload) => actualizarStockProducto(producto.id, payload.stockActual)}
                  />
                  <Link
                    href={`/inventario/${producto.id}`}
                    className="text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)]"
                  >
                    Historial
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricaInventario({
  label,
  valor,
  descripcion,
  valorClassName,
}: {
  label: string
  valor: string
  descripcion: string
  valorClassName?: string
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)] mb-2">
        {label}
      </p>
      <p className={`text-[26px] font-[300] text-[var(--text)] tracking-[-0.03em] font-[family-name:var(--font-sans)] ${valorClassName ?? ''}`}>
        {valor}
      </p>
      <p className="text-[11px] text-[var(--text-3)] mt-1">{descripcion}</p>
    </div>
  )
}

function EstadoStock({
  producto,
  compact = false,
}: {
  producto: ProductoInventario
  compact?: boolean
}) {
  if (producto.stock_actual === 0) {
    return <Badge variant="default">Sin stock</Badge>
  }

  if (producto.stock_actual <= producto.stock_minimo) {
    return <Badge variant="danger">{compact ? 'Bajo' : 'Stock bajo'}</Badge>
  }

  return compact ? null : <Badge variant="success">Disponible</Badge>
}

function DatoCard({
  label,
  valor,
}: {
  label: string
  valor: string
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
        {label}
      </p>
      <p className="text-[13px] text-[var(--text)] font-[family-name:var(--font-mono)] mt-1">
        {valor}
      </p>
    </div>
  )
}

function EstadoVacio({ className = 'p-6' }: { className?: string }) {
  return (
    <div className={`${className} text-center`}>
      <div className="mx-auto h-10 w-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
        <Package className="h-4 w-4 text-[var(--text-3)]" />
      </div>
      <p className="text-[13px] text-[var(--text)] mt-3">No encontramos productos con este filtro.</p>
      <p className="text-[12px] text-[var(--text-3)] mt-1">
        Ajusta la busqueda o crea un nuevo item para empezar.
      </p>
    </div>
  )
}
