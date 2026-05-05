import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { BadgeEstado } from '@/components/ui/badge'
import { Plus, FileText } from 'lucide-react'
import { formatearUSD, formatearNumero } from '@/lib/calculos'
import { ETIQUETAS_SISTEMA } from '@/lib/constants'
import type { Cotizacion, EstadoCotizacion, TipoSistema } from '@/types/cotizaciones'

interface SearchParams {
  estado?: EstadoCotizacion
  tipo?: TipoSistema
  q?: string
}

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  let query = supabase
    .from('cotizaciones')
    .select('id, numero_cotizacion, tipo_sistema, kwp_calculado, total_usd, estado, created_at, clientes(nombre)')
    .order('created_at', { ascending: false })

  if (searchParams.estado) {
    query = query.eq('estado', searchParams.estado)
  }
  if (searchParams.tipo) {
    query = query.eq('tipo_sistema', searchParams.tipo)
  }

  const { data: cotizaciones, error } = await query.limit(100)

  if (error) {
    return (
      <div className="text-[13px] text-[var(--red)]">
        Error al cargar cotizaciones: {error.message}
      </div>
    )
  }

  const lista = (cotizaciones ?? []) as unknown as (Cotizacion & {
    clientes: { nombre: string } | null
  })[]

  const filtradas = searchParams.q
    ? lista.filter((c) => {
        const q = searchParams.q!.toLowerCase()
        return (
          c.numero_cotizacion.toLowerCase().includes(q) ||
          c.clientes?.nombre.toLowerCase().includes(q)
        )
      })
    : lista

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Cotizaciones
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            {filtradas.length} cotización{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Link href="/cotizaciones/nueva">
          <Button variant="accent" size="md">
            <Plus className="h-3.5 w-3.5" />
            Nueva cotización
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <FiltrosCotizaciones
        estadoActivo={searchParams.estado}
        tipoActivo={searchParams.tipo}
        busqueda={searchParams.q}
      />

      {/* Tabla */}
      {filtradas.length === 0 ? (
        <EstadoVacio tieneFiltros={!!(searchParams.estado || searchParams.tipo || searchParams.q)} />
      ) : (
        <TablaCotizaciones cotizaciones={filtradas} />
      )}
    </div>
  )
}

function FiltrosCotizaciones({
  estadoActivo,
  busqueda,
}: {
  estadoActivo?: string
  tipoActivo?: string
  busqueda?: string
}) {
  const estados: { valor: EstadoCotizacion | ''; label: string }[] = [
    { valor: '', label: 'Todos' },
    { valor: 'borrador', label: 'Borrador' },
    { valor: 'enviada', label: 'Enviada' },
    { valor: 'aprobada', label: 'Aprobada' },
    { valor: 'en_instalacion', label: 'En instalación' },
    { valor: 'completada', label: 'Completada' },
    { valor: 'rechazada', label: 'Rechazada' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      {/* Búsqueda */}
      <form className="flex-1">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por cliente o número..."
          className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </form>

      {/* Filtro estado */}
      <div className="flex gap-1 flex-wrap">
        {estados.map((e) => (
          <Link
            key={e.valor}
            href={e.valor ? `?estado=${e.valor}` : '/cotizaciones'}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors ${
              (estadoActivo ?? '') === e.valor
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'bg-[var(--surface)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {e.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function TablaCotizaciones({
  cotizaciones,
}: {
  cotizaciones: (Cotizacion & { clientes: { nombre: string } | null })[]
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Header tabla — solo desktop */}
      <div className="hidden md:grid grid-cols-[1fr_120px_100px_120px_100px_90px] gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Cliente / Número
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Sistema
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] text-right">
          KWp
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] text-right">
          Total USD
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Estado
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Fecha
        </p>
      </div>

      {/* Filas */}
      <div className="divide-y divide-[var(--border)]">
        {cotizaciones.map((cot) => (
          <Link
            key={cot.id}
            href={`/cotizaciones/${cot.id}`}
            className="block hover:bg-[var(--surface-2)] transition-colors"
          >
            {/* Mobile */}
            <div className="md:hidden px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--text)] truncate">
                  {cot.clientes?.nombre ?? 'Sin cliente'}
                </p>
                <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mt-0.5">
                  {cot.numero_cotizacion}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-[var(--text-2)]">
                    {ETIQUETAS_SISTEMA[cot.tipo_sistema as TipoSistema]}
                  </span>
                  <span className="text-[var(--text-3)]">·</span>
                  <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--text)]">
                    {formatearNumero(cot.kwp_calculado, 2)}{' '}
                    <span className="text-[var(--text-3)] text-[10px]">KWp</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <BadgeEstado estado={cot.estado as EstadoCotizacion} />
                <span className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                  {formatearUSD(cot.total_usd)}
                </span>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-[1fr_120px_100px_120px_100px_90px] gap-4 px-4 py-3 items-center">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text)] truncate">
                  {cot.clientes?.nombre ?? 'Sin cliente'}
                </p>
                <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                  {cot.numero_cotizacion}
                </p>
              </div>
              <p className="text-[12px] text-[var(--text-2)] truncate">
                {ETIQUETAS_SISTEMA[cot.tipo_sistema as TipoSistema]?.split(' ')[0]}
              </p>
              <p className="text-right font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                {formatearNumero(cot.kwp_calculado, 2)}{' '}
                <span className="text-[var(--text-3)] text-[10px]">KWp</span>
              </p>
              <p className="text-right font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                {formatearUSD(cot.total_usd)}
              </p>
              <BadgeEstado estado={cot.estado as EstadoCotizacion} />
              <p className="text-[11px] text-[var(--text-3)]">
                {new Date(cot.created_at).toLocaleDateString('es-DO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function EstadoVacio({ tieneFiltros }: { tieneFiltros: boolean }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <FileText className="h-8 w-8 text-[var(--text-3)] mx-auto mb-3" />
      <p className="text-[14px] font-medium text-[var(--text)]">
        {tieneFiltros ? 'Sin resultados' : 'Sin cotizaciones aún'}
      </p>
      <p className="text-[13px] text-[var(--text-3)] mt-1 mb-4">
        {tieneFiltros
          ? 'Ninguna cotización coincide con los filtros aplicados.'
          : 'Crea tu primera cotización para comenzar.'}
      </p>
      {!tieneFiltros && (
        <Link href="/cotizaciones/nueva">
          <Button variant="accent" size="md">
            <Plus className="h-3.5 w-3.5" />
            Nueva cotización
          </Button>
        </Link>
      )}
    </div>
  )
}
