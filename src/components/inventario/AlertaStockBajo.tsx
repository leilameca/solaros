import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ProductoStockBajo } from '@/types/inventario'

export function AlertaStockBajo({
  productos,
  href = '/inventario?filtro=stock_bajo',
  compacta = false,
}: {
  productos: ProductoStockBajo[]
  href?: string
  compacta?: boolean
}) {
  if (productos.length === 0) return null

  return (
    <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[var(--red)]">
            {productos.length} productos con stock bajo
          </p>
          <p className="text-[12px] text-[var(--red)] mt-1">
            Revisa inventario antes de comprometer nuevas cotizaciones.
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--red)] whitespace-nowrap"
        >
          Ver inventario
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!compacta ? (
        <ul className="mt-3 space-y-1.5">
          {productos.slice(0, 5).map((producto) => (
            <li key={producto.id} className="text-[12px] text-[var(--red)]">
              {producto.marca} {producto.modelo} — {producto.stock_actual} {producto.unidad} (min: {producto.stock_minimo})
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
