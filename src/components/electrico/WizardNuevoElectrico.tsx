'use client'

import { useEffect, useId, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, BookOpen, Check, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { TablaMateriales } from './TablaMateriales'
import { PanelCatalogo } from './PanelCatalogo'
import { ResumenTotales } from './ResumenTotales'
import { crearCotizacionElectrica } from '@/app/(dashboard)/electrico/actions'
import { calcularTotalesElectrico } from '@/lib/calculos-electrico'
import type {
  ItemElectricoLocal,
  CatalogoMaterial,
  EstadoCotizacionElectrica,
} from '@/types/electrico'

interface ClienteOpcion {
  id: string
  nombre: string
}

interface CotizacionOpcion {
  id: string
  numero_cotizacion: string
}

interface Props {
  clientes: ClienteOpcion[]
  catalogo: CatalogoMaterial[]
  cotizacionesSolares: CotizacionOpcion[]
  cotizacionesBombeo: CotizacionOpcion[]
  tasaDolar: number
  clienteInicial?: ClienteOpcion | null
}

const PASOS = ['Información', 'Materiales', 'Resumen']

export function WizardNuevoElectrico({
  clientes,
  catalogo: catalogoInicial,
  cotizacionesSolares,
  cotizacionesBombeo,
  tasaDolar,
  clienteInicial,
}: Props) {
  const uid = useId()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Estado del wizard ──
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [clienteId, setClienteId] = useState<string | null>(clienteInicial?.id ?? null)
  const [clienteNombre, setClienteNombre] = useState(clienteInicial?.nombre ?? '')
  const [modoNuevoCliente, setModoNuevoCliente] = useState(false)
  const [tipoTrabajo, setTipoTrabajo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cotizacionSolarId, setCotizacionSolarId] = useState<string | null>(null)
  const [cotizacionBombeoId, setCotizacionBombeoId] = useState<string | null>(null)
  const [items, setItems] = useState<ItemElectricoLocal[]>([])
  const [catalogoItems, setCatalogoItems] = useState<CatalogoMaterial[]>(catalogoInicial)
  const [catalogoAbierto, setCatalogoAbierto] = useState(false)
  const [manoObraRd, setManoObraRd] = useState<number | ''>(0)
  const [notas, setNotas] = useState('')
  const [estado, setEstado] = useState<EstadoCotizacionElectrica>('borrador')
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const clientePrefillKey = clienteInicial?.id ?? 'nuevo'

  useEffect(() => {
    setPaso(1)
    setClienteId(clienteInicial?.id ?? null)
    setClienteNombre(clienteInicial?.nombre ?? '')
    setModoNuevoCliente(false)
    setErrorGuardar(null)
  }, [clientePrefillKey, clienteInicial])

  const totales = useMemo(
    () =>
      calcularTotalesElectrico(
        items,
        typeof manoObraRd === 'number' ? manoObraRd : 0,
        tasaDolar
      ),
    [items, manoObraRd, tasaDolar]
  )

  // ── Handlers ──

  function handleSeleccionarCliente(valor: string) {
    if (valor === '__nuevo__') {
      setClienteId(null)
      setClienteNombre('')
      setModoNuevoCliente(true)
    } else {
      const cliente = clientes.find((c) => c.id === valor)
      setClienteId(valor)
      setClienteNombre(cliente?.nombre ?? '')
      setModoNuevoCliente(false)
    }
  }

  function handleAgregarDelCatalogo(material: CatalogoMaterial) {
    const nuevo: ItemElectricoLocal = {
      localId: `${uid}-cat-${Date.now()}`,
      descripcion: material.descripcion,
      unidad: material.unidad,
      cantidad: 1,
      precio_unit_rd: material.precio_sugerido_rd,
      orden: items.length,
    }
    setItems((prev) => [...prev, nuevo])
  }

  function handleMaterialGuardado(material: CatalogoMaterial) {
    setCatalogoItems((prev) => [...prev, material])
  }

  function validarPaso1(): string | null {
    if (!tipoTrabajo.trim()) return 'El tipo de trabajo es requerido'
    return null
  }

  function handleSiguiente() {
    if (paso === 1) {
      const err = validarPaso1()
      if (err) { setErrorGuardar(err); return }
      setErrorGuardar(null)
      setPaso(2)
    } else if (paso === 2) {
      setPaso(3)
    }
  }

  function handleGuardar() {
    setErrorGuardar(null)
    startTransition(async () => {
      const resultado = await crearCotizacionElectrica({
        clienteId,
        clienteNombre: modoNuevoCliente ? clienteNombre : (clientes.find((c) => c.id === clienteId)?.nombre ?? clienteNombre),
        tipoTrabajo,
        descripcion,
        items: items.map((i) => ({
          descripcion: i.descripcion,
          unidad: i.unidad,
          cantidad: i.cantidad,
          precio_unit_rd: i.precio_unit_rd,
          orden: i.orden,
        })),
        manoObraRd: typeof manoObraRd === 'number' ? manoObraRd : 0,
        notas,
        estado,
        cotizacionSolarId,
        cotizacionBombeoId,
      })
      if (resultado?.error) {
        setErrorGuardar(resultado.error)
        toast.error(resultado.error)
      }
    })
  }

  // ── Render ──

  return (
    <div className="max-w-full">
      {/* ── Indicador de pasos ── */}
      <div className="flex items-center gap-0 mb-8">
        {PASOS.map((nombre, i) => {
          const num = i + 1
          const activo = paso === num
          const completado = paso > num
          return (
            <div key={nombre} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ${
                    completado
                      ? 'bg-[var(--green)] text-white'
                      : activo
                      ? 'bg-[var(--text)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border-s)]'
                  }`}
                >
                  {completado ? <Check className="h-3 w-3" /> : num}
                </div>
                <span
                  className={`text-[12px] font-medium hidden sm:inline ${
                    activo ? 'text-[var(--text)]' : 'text-[var(--text-3)]'
                  }`}
                >
                  {nombre}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div className="w-8 h-px bg-[var(--border-s)] mx-2" />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Paso 1: Información básica ── */}
      {paso === 1 && (
        <div className="max-w-[600px] space-y-5">
          <div>
            <h2 className="text-[16px] font-medium text-[var(--text)] tracking-[-0.02em] mb-0.5">
              Información del servicio
            </h2>
            <p className="text-[13px] text-[var(--text-3)]">
              Datos del cliente y tipo de trabajo eléctrico
            </p>
          </div>

          {/* Cliente */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] block mb-1.5">
              Cliente
            </label>
            {!modoNuevoCliente ? (
              <select
                value={clienteId ?? ''}
                onChange={(e) => handleSeleccionarCliente(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                <option value="">Sin cliente asignado</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
                <option value="__nuevo__">+ Nuevo cliente</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setModoNuevoCliente(false)
                    setClienteNombre('')
                    setClienteId(null)
                  }}
                  className="text-[12px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                >
                  Seleccionar cliente existente
                </button>
              </div>
            )}
          </div>

          {/* Tipo de trabajo */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] block mb-1.5">
              Tipo de trabajo *
            </label>
            <input
              value={tipoTrabajo}
              onChange={(e) => setTipoTrabajo(e.target.value)}
              list="tipos-trabajo"
              placeholder="Ej. Instalación eléctrica residencial"
              className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <datalist id="tipos-trabajo">
              <option value="Instalación eléctrica residencial" />
              <option value="Instalación eléctrica comercial" />
              <option value="Actualización de tablero" />
              <option value="Cableado estructurado" />
              <option value="Mantenimiento eléctrico" />
              <option value="Automatización" />
              <option value="Iluminación LED" />
            </datalist>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] block mb-1.5">
              Descripción del trabajo
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el alcance del servicio eléctrico..."
              rows={3}
              className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>

          {/* Vinculación opcional */}
          {(cotizacionesSolares.length > 0 || cotizacionesBombeo.length > 0) && (
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
                Vincular con otra cotización (opcional)
              </p>
              <div className="space-y-3">
                {cotizacionesSolares.length > 0 && (
                  <div>
                    <label className="text-[11px] text-[var(--text-2)] block mb-1">
                      Cotización solar
                    </label>
                    <select
                      value={cotizacionSolarId ?? ''}
                      onChange={(e) =>
                        setCotizacionSolarId(e.target.value || null)
                      }
                      className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    >
                      <option value="">Sin vincular</option>
                      {cotizacionesSolares.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numero_cotizacion}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {cotizacionesBombeo.length > 0 && (
                  <div>
                    <label className="text-[11px] text-[var(--text-2)] block mb-1">
                      Cotización bombeo
                    </label>
                    <select
                      value={cotizacionBombeoId ?? ''}
                      onChange={(e) =>
                        setCotizacionBombeoId(e.target.value || null)
                      }
                      className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    >
                      <option value="">Sin vincular</option>
                      {cotizacionesBombeo.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numero_cotizacion}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {errorGuardar && (
            <p className="text-[12px] text-[var(--red)]">{errorGuardar}</p>
          )}
        </div>
      )}

      {/* ── Paso 2: Tabla de materiales ── */}
      {paso === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-medium text-[var(--text)] tracking-[-0.02em] mb-0.5">
                Lista de materiales
              </h2>
              <p className="text-[13px] text-[var(--text-3)]">
                {items.length} item{items.length !== 1 ? 's' : ''} ·{' '}
                Cálculo automático con ITBIS 18%
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCatalogoAbierto((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-[12px] font-medium border transition-colors ${
                catalogoAbierto
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-bd)]'
                  : 'bg-[var(--surface)] text-[var(--text-2)] border-[var(--border-s)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <TablaMateriales items={items} onChange={setItems} />
            </div>

            {/* Panel catálogo desktop */}
            {catalogoAbierto && (
              <div className="hidden md:block w-[320px] flex-shrink-0">
                <PanelCatalogo
                  catalogo={catalogoItems}
                  abierto={catalogoAbierto}
                  onCerrar={() => setCatalogoAbierto(false)}
                  onAgregarItem={handleAgregarDelCatalogo}
                  onMaterialGuardado={handleMaterialGuardado}
                />
              </div>
            )}
          </div>

          {/* Panel catálogo mobile (drawer) */}
          <div className="md:hidden">
            <PanelCatalogo
              catalogo={catalogoItems}
              abierto={catalogoAbierto}
              onCerrar={() => setCatalogoAbierto(false)}
              onAgregarItem={handleAgregarDelCatalogo}
              onMaterialGuardado={handleMaterialGuardado}
            />
          </div>
        </div>
      )}

      {/* ── Paso 3: Mano de obra + Resumen ── */}
      {paso === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-[16px] font-medium text-[var(--text)] tracking-[-0.02em] mb-0.5">
                Resumen y finalización
              </h2>
              <p className="text-[13px] text-[var(--text-3)]">
                Agrega la mano de obra y revisa los totales
              </p>
            </div>

            {/* Mano de obra */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] block mb-1.5">
                Mano de obra (RD$)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={manoObraRd}
                onChange={(e) =>
                  setManoObraRd(
                    e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
                className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-[family-name:var(--font-mono)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <p className="text-[11px] text-[var(--text-3)] mt-1">
                La mano de obra no lleva ITBIS
              </p>
            </div>

            {/* Notas */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] block mb-1.5">
                Notas internas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas adicionales, condiciones, garantías..."
                rows={3}
                className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>

            {/* Estado inicial */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] block mb-1.5">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value as EstadoCotizacionElectrica)
                }
                className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aprobada">Aprobada</option>
              </select>
            </div>

            {errorGuardar && (
              <p className="text-[12px] text-[var(--red)]">{errorGuardar}</p>
            )}
          </div>

          {/* Resumen totales */}
          <div className="space-y-4">
            <ResumenTotales
              totales={totales}
              manoObraRd={typeof manoObraRd === 'number' ? manoObraRd : 0}
              tasaDolar={tasaDolar}
            />

            {/* Mini resumen del servicio */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
                Servicio
              </p>
              <div className="space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[12px] text-[var(--text-3)]">Tipo</span>
                  <span className="text-[12px] font-medium text-[var(--text)] text-right">
                    {tipoTrabajo || '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[12px] text-[var(--text-3)]">Materiales</span>
                  <span className="text-[12px] font-[family-name:var(--font-mono)] text-[var(--text)]">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {clienteId && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[12px] text-[var(--text-3)]">Cliente</span>
                    <span className="text-[12px] text-[var(--text)] text-right">
                      {clientes.find((c) => c.id === clienteId)?.nombre}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navegación entre pasos ── */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => {
            if (paso === 1) router.push('/electrico')
            else setPaso((p) => (p - 1) as 1 | 2 | 3)
          }}
          className="flex items-center gap-1.5 bg-transparent text-[var(--text)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {paso === 1 ? 'Cancelar' : 'Atrás'}
        </button>

        {paso < 3 ? (
          <button
            type="button"
            onClick={handleSiguiente}
            className="flex items-center gap-1.5 bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-[var(--accent)] text-white rounded-[var(--radius-sm)] px-5 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {isPending ? 'Guardando...' : 'Crear cotización'}
          </button>
        )}
      </div>
    </div>
  )
}
