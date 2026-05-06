'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, X, BookOpen } from 'lucide-react'
import { guardarMaterialCatalogo } from '@/app/(dashboard)/electrico/actions'
import { formatearRD2 } from '@/lib/calculos-electrico'
import type { CatalogoMaterial, NuevoCatalogoMaterialInput } from '@/types/electrico'

interface Props {
  catalogo: CatalogoMaterial[]
  abierto: boolean
  onCerrar: () => void
  onAgregarItem: (material: CatalogoMaterial) => void
  onMaterialGuardado: (material: CatalogoMaterial) => void
}

const FORM_VACIO: NuevoCatalogoMaterialInput = {
  descripcion: '',
  unidad: 'unidad',
  precioSugeridoRd: 0,
  categoria: '',
}

export function PanelCatalogo({
  catalogo,
  abierto,
  onCerrar,
  onAgregarItem,
  onMaterialGuardado,
}: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)
  const [form, setForm] = useState<NuevoCatalogoMaterialInput>(FORM_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtrados = catalogo.filter((m) =>
    m.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    (m.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

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
        onMaterialGuardado(resultado.data)
        setForm(FORM_VACIO)
        setMostrarFormNuevo(false)
      }
    })
  }

  const contenido = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--text-3)]" />
          <p className="text-[13px] font-medium text-[var(--text)]">Catálogo de materiales</p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="p-1 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Búsqueda */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-3)]" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar material..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] pl-8 pr-3 py-2 text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {filtrados.length === 0 && (
          <p className="text-[12px] text-[var(--text-3)] text-center py-6">
            {busqueda ? 'Sin resultados' : 'Catálogo vacío'}
          </p>
        )}

        {/* Agrupar por categoría cuando hay filtrado genérico */}
        {!busqueda && categorias.length > 0
          ? categorias.map((cat) => {
              const itemsCat = filtrados.filter((m) => m.categoria === cat)
              if (itemsCat.length === 0) return null
              return (
                <div key={cat}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] px-1 pt-2 pb-1">
                    {cat}
                  </p>
                  {itemsCat.map((m) => (
                    <ItemCatalogo key={m.id} material={m} onAgregar={onAgregarItem} />
                  ))}
                </div>
              )
            })
          : filtrados.map((m) => (
              <ItemCatalogo key={m.id} material={m} onAgregar={onAgregarItem} />
            ))}

        {/* Items sin categoría */}
        {!busqueda && filtrados.filter((m) => !m.categoria).length > 0 && (
          <div>
            {categorias.length > 0 && (
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] px-1 pt-2 pb-1">
                General
              </p>
            )}
            {filtrados
              .filter((m) => !m.categoria)
              .map((m) => (
                <ItemCatalogo key={m.id} material={m} onAgregar={onAgregarItem} />
              ))}
          </div>
        )}
      </div>

      {/* Footer: guardar nuevo material */}
      <div className="border-t border-[var(--border)] flex-shrink-0">
        {!mostrarFormNuevo ? (
          <button
            type="button"
            onClick={() => setMostrarFormNuevo(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Guardar nuevo material al catálogo
          </button>
        ) : (
          <div className="p-3 space-y-2">
            <p className="text-[11px] font-medium text-[var(--text-2)] mb-1.5">
              Nuevo material
            </p>
            <input
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción *"
              className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.unidad}
                onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
                placeholder="Unidad"
                className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
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
                placeholder="Precio sugerido RD$"
                className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] font-[family-name:var(--font-mono)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <input
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              placeholder="Categoría (opcional)"
              list="categorias-existentes"
              className="w-full bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <datalist id="categorias-existentes">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {error && (
              <p className="text-[11px] text-[var(--red)]">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleGuardarNuevo}
                disabled={isPending}
                className="flex-1 bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-sm)] py-1.5 text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
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
                className="px-3 bg-transparent text-[var(--text)] border border-[var(--border-s)] rounded-[var(--radius-sm)] py-1.5 text-[12px] font-medium hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop: panel lateral ── */}
      <div
        className={`hidden md:flex flex-col w-[320px] flex-shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-200 ${
          abierto ? 'opacity-100' : 'opacity-0 pointer-events-none w-0'
        }`}
        style={{ height: 'fit-content', maxHeight: 600 }}
      >
        {contenido}
      </div>

      {/* ── Mobile: bottom drawer ── */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          abierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onCerrar}
        />
        {/* Sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-[var(--surface)] rounded-t-[16px] transition-transform duration-300 ${
            abierto ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-[var(--border-s)]" />
          </div>
          <div className="flex-1 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            {contenido}
          </div>
        </div>
      </div>
    </>
  )
}

function ItemCatalogo({
  material,
  onAgregar,
}: {
  material: CatalogoMaterial
  onAgregar: (m: CatalogoMaterial) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onAgregar(material)}
      className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[var(--text)] truncate">{material.descripcion}</p>
        <p className="text-[10px] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          {material.unidad}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {material.precio_sugerido_rd > 0 && (
          <span className="text-[11px] font-[family-name:var(--font-mono)] text-[var(--text-2)]">
            RD$ {formatearRD2(material.precio_sugerido_rd)}
          </span>
        )}
        <Plus className="h-3.5 w-3.5 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors" />
      </div>
    </button>
  )
}
