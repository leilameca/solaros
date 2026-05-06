import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Zap } from 'lucide-react'
import { formatearRD2 } from '@/lib/calculos-electrico'
import type { CotizacionElectrica, EstadoCotizacionElectrica } from '@/types/electrico'
import { ETIQUETAS_ESTADO_ELECTRICO } from '@/types/electrico'

const ESTADO_VARIANT: Record<
  EstadoCotizacionElectrica,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  borrador: 'default',
  enviada: 'info',
  aprobada: 'success',
  en_instalacion: 'warning',
  completada: 'success',
  rechazada: 'danger',
}

interface SearchParams {
  estado?: EstadoCotizacionElectrica
  q?: string
}

export default async function ElectricoPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  let query = supabase
    .from('cotizaciones_electricas')
    .select(
      'id, numero_cotizacion, tipo_trabajo, total_rd, total_usd, estado, created_at, clientes(nombre)'
    )
    .order('created_at', { ascending: false })

  if (searchParams.estado) {
    query = query.eq('estado', searchParams.estado)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    return (
      <div className="text-[13px] text-[var(--red)]">
        Error al cargar cotizaciones: {error.message}
      </div>
    )
  }

  const lista = (data ?? []) as unknown as (CotizacionElectrica & {
    clientes: { nombre: string } | null
  })[]

  const filtradas = searchParams.q
    ? lista.filter((c) => {
        const q = searchParams.q!.toLowerCase()
        return (
          c.numero_cotizacion.toLowerCase().includes(q) ||
          c.tipo_trabajo.toLowerCase().includes(q) ||
          c.clientes?.nombre.toLowerCase().includes(q)
        )
      })
    : lista

  const estados: { valor: EstadoCotizacionElectrica | ''; label: string }[] = [
    { valor: '', label: 'Todos' },
    { valor: 'borrador', label: 'Borrador' },
    { valor: 'enviada', label: 'Enviada' },
    { valor: 'aprobada', label: 'Aprobada' },
    { valor: 'en_instalacion', label: 'En instalación' },
    { valor: 'completada', label: 'Completada' },
    { valor: 'rechazada', label: 'Rechazada' },
  ]

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Servicios eléctricos
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            {filtradas.length} cotización{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/electrico/catalogo">
            <Button variant="secondary" size="sm">
              Catálogo
            </Button>
          </Link>
          <Link href="/electrico/nueva">
            <Button variant="accent" size="md">
              <Plus className="h-3.5 w-3.5" />
              Nueva cotización
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form className="flex-1">
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por cliente, tipo o número..."
            className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </form>
        <div className="flex gap-1 flex-wrap">
          {estados.map((e) => (
            <Link
              key={e.valor}
              href={e.valor ? `?estado=${e.valor}` : '/electrico'}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors ${
                (searchParams.estado ?? '') === e.valor
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'bg-[var(--surface)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {e.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {filtradas.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Zap className="h-8 w-8 text-[var(--text-3)] mx-auto mb-3" />
          <p className="text-[14px] font-medium text-[var(--text)]">
            {searchParams.estado || searchParams.q
              ? 'Sin resultados'
              : 'Sin cotizaciones eléctricas aún'}
          </p>
          <p className="text-[13px] text-[var(--text-3)] mt-1 mb-4">
            {searchParams.estado || searchParams.q
              ? 'Ninguna cotización coincide con los filtros aplicados.'
              : 'Crea tu primera cotización de servicios eléctricos.'}
          </p>
          {!searchParams.estado && !searchParams.q && (
            <Link href="/electrico/nueva">
              <Button variant="accent" size="md">
                <Plus className="h-3.5 w-3.5" />
                Nueva cotización
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Header tabla desktop */}
          <div className="hidden md:grid grid-cols-[1fr_160px_120px_130px_100px_90px] gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
            {['Cliente / Número', 'Tipo trabajo', 'Total RD$', 'Total USD', 'Estado', 'Fecha'].map(
              (col) => (
                <p
                  key={col}
                  className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]"
                >
                  {col}
                </p>
              )
            )}
          </div>

          <div className="divide-y divide-[var(--border)]">
            {filtradas.map((cot) => (
              <Link
                key={cot.id}
                href={`/electrico/${cot.id}`}
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
                    <p className="text-[12px] text-[var(--text-2)] mt-0.5 truncate">
                      {cot.tipo_trabajo}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={ESTADO_VARIANT[cot.estado]}>
                      {ETIQUETAS_ESTADO_ELECTRICO[cot.estado]}
                    </Badge>
                    <span className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                      RD$ {formatearRD2(cot.total_rd)}
                    </span>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[1fr_160px_120px_130px_100px_90px] gap-4 px-4 py-3 items-center">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text)] truncate">
                      {cot.clientes?.nombre ?? 'Sin cliente'}
                    </p>
                    <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                      {cot.numero_cotizacion}
                    </p>
                  </div>
                  <p className="text-[12px] text-[var(--text-2)] truncate">
                    {cot.tipo_trabajo}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)] text-right">
                    {formatearRD2(cot.total_rd)}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)] text-right">
                    ${' '}
                    {cot.total_usd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <Badge variant={ESTADO_VARIANT[cot.estado]}>
                    {ETIQUETAS_ESTADO_ELECTRICO[cot.estado]}
                  </Badge>
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
      )}
    </div>
  )
}
