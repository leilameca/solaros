'use client'

import { useId } from 'react'
import { Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { ITBIS_RATE, formatearRD2 } from '@/lib/calculos-electrico'
import type { ItemElectricoLocal } from '@/types/electrico'

interface Props {
  items: ItemElectricoLocal[]
  onChange: (items: ItemElectricoLocal[]) => void
}

export function TablaMateriales({ items, onChange }: Props) {
  const uid = useId()

  function agregarFila() {
    const nuevaFila: ItemElectricoLocal = {
      localId: `${uid}-${Date.now()}`,
      descripcion: '',
      unidad: 'unidad',
      cantidad: 1,
      precio_unit_rd: 0,
      orden: items.length,
    }
    onChange([...items, nuevaFila])
  }

  function actualizarFila(
    localId: string,
    campo: keyof ItemElectricoLocal,
    valor: string | number
  ) {
    onChange(
      items.map((item) =>
        item.localId === localId ? { ...item, [campo]: valor } : item
      )
    )
  }

  function eliminarFila(localId: string) {
    onChange(
      items
        .filter((item) => item.localId !== localId)
        .map((item, i) => ({ ...item, orden: i }))
    )
  }

  function moverFila(localId: string, direccion: 'arriba' | 'abajo') {
    const idx = items.findIndex((i) => i.localId === localId)
    if (direccion === 'arriba' && idx === 0) return
    if (direccion === 'abajo' && idx === items.length - 1) return
    const nuevos = [...items]
    const swapIdx = direccion === 'arriba' ? idx - 1 : idx + 1
    ;[nuevos[idx], nuevos[swapIdx]] = [nuevos[swapIdx], nuevos[idx]]
    onChange(nuevos.map((item, i) => ({ ...item, orden: i })))
  }

  return (
    <div>
      {/* ── Desktop: tabla ── */}
      <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_80px_90px_120px_110px_110px_90px] gap-2 px-3 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
          {['Descripción', 'Unidad', 'Cant.', 'Precio unit. RD$', 'Subtotal', 'ITBIS 18%', ''].map(
            (col, i) => (
              <p
                key={i}
                className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]"
              >
                {col}
              </p>
            )
          )}
        </div>

        {/* Estado vacío */}
        {items.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px] text-[var(--text-3)]">
            Agrega materiales con el botón o desde el catálogo
          </div>
        )}

        {/* Filas */}
        {items.map((item, idx) => {
          const subtotal = item.precio_unit_rd * item.cantidad
          const itbis = subtotal * ITBIS_RATE
          const total = subtotal + itbis

          return (
            <div
              key={item.localId}
              className="grid grid-cols-[1fr_80px_90px_120px_110px_110px_90px] gap-2 px-3 py-1.5 border-b border-[var(--border)] last:border-b-0 items-center group"
            >
              <input
                value={item.descripcion}
                onChange={(e) =>
                  actualizarFila(item.localId, 'descripcion', e.target.value)
                }
                placeholder="Descripción del material"
                className="w-full bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:bg-[var(--surface-2)] rounded px-1 py-1 -mx-1 transition-colors"
              />
              <input
                value={item.unidad}
                onChange={(e) =>
                  actualizarFila(item.localId, 'unidad', e.target.value)
                }
                className="w-full bg-transparent text-[12px] text-[var(--text-2)] focus:outline-none focus:bg-[var(--surface-2)] rounded px-1 py-1 -mx-1 transition-colors"
              />
              <input
                type="number"
                min={0}
                step="any"
                value={item.cantidad}
                onChange={(e) =>
                  actualizarFila(
                    item.localId,
                    'cantidad',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-transparent text-[12px] text-right font-[family-name:var(--font-mono)] text-[var(--text)] focus:outline-none focus:bg-[var(--surface-2)] rounded px-1 py-1 transition-colors"
              />
              <input
                type="number"
                min={0}
                step="any"
                value={item.precio_unit_rd}
                onChange={(e) =>
                  actualizarFila(
                    item.localId,
                    'precio_unit_rd',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-transparent text-[12px] text-right font-[family-name:var(--font-mono)] text-[var(--text)] focus:outline-none focus:bg-[var(--surface-2)] rounded px-1 py-1 transition-colors"
              />
              <span className="text-[12px] text-right font-[family-name:var(--font-mono)] text-[var(--text-2)] px-1">
                {formatearRD2(subtotal)}
              </span>
              <span className="text-[12px] text-right font-[family-name:var(--font-mono)] text-[var(--text-3)] px-1">
                {formatearRD2(itbis)}
              </span>

              {/* Controles: total + mover + eliminar */}
              <div className="flex items-center justify-end gap-1">
                <span className="text-[12px] font-[family-name:var(--font-mono)] font-medium text-[var(--text)]">
                  {formatearRD2(total)}
                </span>
                <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                  <button
                    type="button"
                    onClick={() => moverFila(item.localId, 'arriba')}
                    disabled={idx === 0}
                    className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moverFila(item.localId, 'abajo')}
                    disabled={idx === items.length - 1}
                    className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarFila(item.localId)}
                  className="p-0.5 text-[var(--text-3)] hover:text-[var(--red)] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}

        {/* Footer: agregar fila */}
        <div className="px-3 py-2 bg-[var(--surface-2)] border-t border-[var(--border)]">
          <button
            type="button"
            onClick={agregarFila}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar fila
          </button>
        </div>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="md:hidden space-y-2">
        {items.map((item, idx) => {
          const subtotal = item.precio_unit_rd * item.cantidad
          const itbis = subtotal * ITBIS_RATE
          const total = subtotal + itbis

          return (
            <div
              key={item.localId}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              {/* Descripción + eliminar */}
              <div className="flex items-start gap-2 mb-2.5">
                <input
                  value={item.descripcion}
                  onChange={(e) =>
                    actualizarFila(item.localId, 'descripcion', e.target.value)
                  }
                  placeholder="Descripción del material"
                  className="flex-1 bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moverFila(item.localId, 'arriba')}
                    disabled={idx === 0}
                    className="p-1 text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moverFila(item.localId, 'abajo')}
                    disabled={idx === items.length - 1}
                    className="p-1 text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarFila(item.localId)}
                  className="p-1.5 text-[var(--text-3)] hover:text-[var(--red)] transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Campos en grid 3 columnas */}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                    Unidad
                  </p>
                  <input
                    value={item.unidad}
                    onChange={(e) =>
                      actualizarFila(item.localId, 'unidad', e.target.value)
                    }
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                    Cantidad
                  </p>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={item.cantidad}
                    onChange={(e) =>
                      actualizarFila(
                        item.localId,
                        'cantidad',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px] text-right font-[family-name:var(--font-mono)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                    Precio RD$
                  </p>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={item.precio_unit_rd}
                    onChange={(e) =>
                      actualizarFila(
                        item.localId,
                        'precio_unit_rd',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px] text-right font-[family-name:var(--font-mono)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Totales calculados */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)]">
                <div>
                  <p className="text-[10px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-0.5">
                    Subtotal
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--text-2)]">
                    {formatearRD2(subtotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-0.5">
                    ITBIS 18%
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--text-3)]">
                    {formatearRD2(itbis)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-0.5">
                    Total c/ITBIS
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[12px] font-medium text-[var(--text)]">
                    {formatearRD2(total)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {/* Botón agregar mobile */}
        <button
          type="button"
          onClick={agregarFila}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[var(--border-s)] rounded-[var(--radius)] text-[13px] font-medium text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar material
        </button>
      </div>
    </div>
  )
}
