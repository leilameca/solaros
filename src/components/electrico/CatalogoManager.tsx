'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Check, X, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import {
  guardarMaterialCatalogo,
  actualizarMaterialCatalogo,
  toggleActivoCatalogo,
} from '@/app/(dashboard)/electrico/actions'
import { formatearRD2 } from '@/lib/calculos-electrico'
import type { CatalogoMaterial, NuevoCatalogoMaterialInput } from '@/types/electrico'

interface Props {
  catalogoInicial: CatalogoMaterial[]
}

const FORM_VACIO: NuevoCatalogoMaterialInput = {
  descripcion: '',
  unidad: 'unidad',
  precioSugeridoRd: 0,
  categoria: '',
}

export function CatalogoManager({ catalogoInicial }: Props) {
  const [catalogo, setCatalogo] = useState<CatalogoMaterial[]>(catalogoInicial)
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)
  const [form, setForm] = useState<NuevoCatalogoMaterialInput>(FORM_VACIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<NuevoCatalogoMaterialInput>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const categorias = Array.from(
    new Set(catalogo.map((m) => m.categoria).filter(Boolean))
  ) as string[]

  function handleGuardarNuevo() {
    if (!form.descripcion.trim()) {
      setError('La descripción es requerida')
      return
    }
    setError(null)
    startTransition(async () => {
      const resultado = await guardarMaterialCatalogo(form)
      if (resultado.error) {
        setError(resultado.error)
      } else if (resultado.data) {
        setCatalogo((prev) => [...prev, resultado.data!])
        setForm(FORM_VACIO)
        setMostrarFormNuevo(false)
      }
    })
  }

  function iniciarEdicion(material: CatalogoMaterial) {
    setEditandoId(material.id)
    setEditForm({
      descripcion: material.descripcion,
      unidad: material.unidad,
      precioSugeridoRd: material.precio_sugerido_rd,
      categoria: material.categoria ?? '',
    })
  }

  function handleGuardarEdicion(id: string) {
    if (!editForm.descripcion.trim()) return
    startTransition(async () => {
      const resultado = await actualizarMaterialCatalogo(id, editForm)
      if (resultado.ok) {
        setCatalogo((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  descripcion: editForm.descripcion,
                  unidad: editForm.unidad,
                  precio_sugerido_rd: editForm.precioSugeridoRd,
                  categoria: editForm.categoria || null,
                }
              : m
          )
        )
        setEditandoId(null)
      }
    })
  }

  function handleToggleActivo(id: string, activo: boolean) {
    startTransition(async () => {
      await toggleActivoCatalogo(id, !activo)
      setCatalogo((prev) =>
        prev.map((m) => (m.id === id ? { ...m, activo: !activo } : m))
      )
    })
  }

  const activos = catalogo.filter((m) => m.activo)
  const inactivos = catalogo.filter((m) => !m.activo)

  return (
    <div className="space-y-4">
      {/* Botón agregar */}
      {!mostrarFormNuevo && (
        <button
          type="button"
          onClick={() => setMostrarFormNuevo(true)}
          className="flex items-center gap-2 bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar material
        </button>
      )}

      {/* Formulario nuevo */}
      {mostrarFormNuevo && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
            Nuevo material
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-[var(--text-3)] block mb-1">
                Descripción *
              </label>
              <input
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Nombre del material"
                className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-3)] block mb-1">
                Unidad
              </label>
              <input
                value={form.unidad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unidad: e.target.value }))
                }
                list="unidades-lista"
                className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <datalist id="unidades-lista">
                <option value="unidad" />
                <option value="metro" />
                <option value="rollo" />
                <option value="caja" />
                <option value="par" />
                <option value="kg" />
              </datalist>
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-3)] block mb-1">
                Precio sugerido RD$
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={form.precioSugeridoRd}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    precioSugeridoRd: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-[family-name:var(--font-mono)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] text-[var(--text-3)] block mb-1">
                Categoría (opcional)
              </label>
              <input
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria: e.target.value }))
                }
                list="categorias-form"
                placeholder="Ej. Cableado, Protecciones, Iluminación..."
                className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <datalist id="categorias-form">
                {categorias.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {error && <p className="text-[12px] text-[var(--red)] mt-2">{error}</p>}

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleGuardarNuevo}
              disabled={isPending}
              className="bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarFormNuevo(false)
                setForm(FORM_VACIO)
                setError(null)
              }}
              className="bg-transparent text-[var(--text)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista activos */}
      {activos.length > 0 && (
        <TablaCatalogo
          titulo="Materiales activos"
          items={activos}
          editandoId={editandoId}
          editForm={editForm}
          setEditForm={setEditForm}
          onIniciarEdicion={iniciarEdicion}
          onGuardarEdicion={handleGuardarEdicion}
          onCancelarEdicion={() => setEditandoId(null)}
          onToggleActivo={handleToggleActivo}
          isPending={isPending}
          categorias={categorias}
        />
      )}

      {/* Lista inactivos */}
      {inactivos.length > 0 && (
        <TablaCatalogo
          titulo="Materiales desactivados"
          items={inactivos}
          editandoId={editandoId}
          editForm={editForm}
          setEditForm={setEditForm}
          onIniciarEdicion={iniciarEdicion}
          onGuardarEdicion={handleGuardarEdicion}
          onCancelarEdicion={() => setEditandoId(null)}
          onToggleActivo={handleToggleActivo}
          isPending={isPending}
          categorias={categorias}
          dimmed
        />
      )}

      {catalogo.length === 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-[14px] font-medium text-[var(--text)]">
            Catálogo vacío
          </p>
          <p className="text-[13px] text-[var(--text-3)] mt-1">
            Agrega materiales para usarlos rápidamente en tus cotizaciones
          </p>
        </div>
      )}
    </div>
  )
}

function TablaCatalogo({
  titulo,
  items,
  editandoId,
  editForm,
  setEditForm,
  onIniciarEdicion,
  onGuardarEdicion,
  onCancelarEdicion,
  onToggleActivo,
  isPending,
  categorias,
  dimmed,
}: {
  titulo: string
  items: CatalogoMaterial[]
  editandoId: string | null
  editForm: NuevoCatalogoMaterialInput
  setEditForm: (f: NuevoCatalogoMaterialInput) => void
  onIniciarEdicion: (m: CatalogoMaterial) => void
  onGuardarEdicion: (id: string) => void
  onCancelarEdicion: () => void
  onToggleActivo: (id: string, activo: boolean) => void
  isPending: boolean
  categorias: string[]
  dimmed?: boolean
}) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${
        dimmed ? 'opacity-60' : ''
      }`}
    >
      <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          {titulo} — {items.length}
        </p>
      </div>

      {/* Header desktop */}
      <div className="hidden md:grid grid-cols-[1fr_100px_130px_150px_100px] gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
        {['Descripción', 'Unidad', 'Precio RD$', 'Categoría', ''].map(
          (col) => (
            <p
              key={col}
              className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)]"
            >
              {col}
            </p>
          )
        )}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {items.map((material) => {
          const editando = editandoId === material.id
          return (
            <div key={material.id} className="px-4">
              {editando ? (
                /* Fila de edición */
                <div className="py-2 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={editForm.descripcion}
                      onChange={(e) =>
                        setEditForm({ ...editForm, descripcion: e.target.value })
                      }
                      className="w-full bg-[var(--surface-2)] border border-[var(--accent)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text)] focus:outline-none"
                    />
                    <input
                      value={editForm.unidad}
                      onChange={(e) =>
                        setEditForm({ ...editForm, unidad: e.target.value })
                      }
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={editForm.precioSugeridoRd}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          precioSugeridoRd: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-[family-name:var(--font-mono)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <input
                      value={editForm.categoria}
                      onChange={(e) =>
                        setEditForm({ ...editForm, categoria: e.target.value })
                      }
                      list="categorias-edit"
                      placeholder="Categoría"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <datalist id="categorias-edit">
                      {categorias.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onGuardarEdicion(material.id)}
                      disabled={isPending}
                      className="flex items-center gap-1 bg-[var(--green)] text-white rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={onCancelarEdicion}
                      className="flex items-center gap-1 bg-transparent text-[var(--text)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-medium hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Fila normal */
                <>
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[1fr_100px_130px_150px_100px] gap-3 py-2.5 items-center">
                    <p className="text-[13px] text-[var(--text)]">
                      {material.descripcion}
                    </p>
                    <p className="text-[12px] text-[var(--text-2)]">
                      {material.unidad}
                    </p>
                    <p className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--text)]">
                      {material.precio_sugerido_rd > 0
                        ? `RD$ ${formatearRD2(material.precio_sugerido_rd)}`
                        : '—'}
                    </p>
                    <p className="text-[11px] text-[var(--text-3)]">
                      {material.categoria ?? '—'}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => onIniciarEdicion(material)}
                        className="p-1.5 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleActivo(material.id, material.activo)
                        }
                        className="p-1.5 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                        title={material.activo ? 'Desactivar' : 'Activar'}
                      >
                        {material.activo ? (
                          <ToggleRight className="h-4 w-4 text-[var(--green)]" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text)] truncate">
                        {material.descripcion}
                      </p>
                      <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mt-0.5">
                        {material.unidad}
                        {material.precio_sugerido_rd > 0
                          ? ` · RD$ ${formatearRD2(material.precio_sugerido_rd)}`
                          : ''}
                        {material.categoria ? ` · ${material.categoria}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onIniciarEdicion(material)}
                        className="p-2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleActivo(material.id, material.activo)
                        }
                        className="p-2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                      >
                        {material.activo ? (
                          <ToggleRight className="h-4 w-4 text-[var(--green)]" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
