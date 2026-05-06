import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, Waves } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EstadoBombeoBadge } from '@/components/bombeo/EstadoBombeoBadge'
import { formatearNumero, formatearUSD } from '@/lib/calculos'
import type {
  CotizacionBombeo,
  EstadoCotizacionBombeo,
  TipoBomba,
  TipoSistemaBombeo,
} from '@/types/bombeo'

const ETIQUETAS_SISTEMA: Record<TipoSistemaBombeo, string> = {
  solar_directo: 'Solar directo',
  solar_vfd: 'Solar VFD',
  electrico: 'Eléctrico',
}

const ETIQUETAS_BOMBA: Record<TipoBomba, string> = {
  sumergible: 'Sumergible',
  superficial: 'Superficial',
}

interface SearchParams {
  estado?: EstadoCotizacionBombeo
  tipoSistema?: TipoSistemaBombeo
  tipoBomba?: TipoBomba
  q?: string
}

export default async function BombeoPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()

  let query = supabase
    .from('cotizaciones_bombeo')
    .select('id, numero_cotizacion, tipo_sistema, tipo_bomba, potencia_hp, total_usd, estado, created_at, clientes(nombre)')
    .order('created_at', { ascending: false })

  if (searchParams.estado) query = query.eq('estado', searchParams.estado)
  if (searchParams.tipoSistema) query = query.eq('tipo_sistema', searchParams.tipoSistema)
  if (searchParams.tipoBomba) query = query.eq('tipo_bomba', searchParams.tipoBomba)

  const { data, error } = await query.limit(100)

  if (error) {
    return (
      <div className="text-[13px] text-[var(--red)]">
        Error al cargar cotizaciones de bombeo: {error.message}
      </div>
    )
  }

  const lista = (data ?? []) as unknown as (CotizacionBombeo & {
    clientes: { nombre: string } | null
  })[]

  const filtradas = searchParams.q
    ? lista.filter((item) => {
        const q = searchParams.q!.toLowerCase()
        return (
          item.numero_cotizacion.toLowerCase().includes(q) ||
          item.clientes?.nombre.toLowerCase().includes(q)
        )
      })
    : lista

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Cotizaciones de bombeo
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            {filtradas.length} cotización{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <Link href="/bombeo/nueva">
          <Button variant="accent" size="md">
            <Plus className="h-3.5 w-3.5" />
            Nueva cotización
          </Button>
        </Link>
      </div>

      <FiltrosBombeo
        estadoActivo={searchParams.estado}
        tipoSistemaActivo={searchParams.tipoSistema}
        tipoBombaActiva={searchParams.tipoBomba}
        busqueda={searchParams.q}
      />

      {filtradas.length === 0 ? (
        <EstadoVacio
          tieneFiltros={!!(searchParams.estado || searchParams.tipoSistema || searchParams.tipoBomba || searchParams.q)}
        />
      ) : (
        <TablaBombeo cotizaciones={filtradas} />
      )}
    </div>
  )
}

function buildUrl(
  current: Record<string, string | undefined>,
  override: Record<string, string | undefined>
) {
  const params = new URLSearchParams()
  const merged = { ...current, ...override }
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value)
  }
  const qs = params.toString()
  return `/bombeo${qs ? `?${qs}` : ''}`
}

const CHIP_BASE = 'text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors'
const CHIP_ACTIVE = 'bg-[var(--text)] text-[var(--bg)]'
const CHIP_IDLE = 'bg-[var(--surface)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'

function FiltrosBombeo({
  estadoActivo,
  tipoSistemaActivo,
  tipoBombaActiva,
  busqueda,
}: {
  estadoActivo?: EstadoCotizacionBombeo
  tipoSistemaActivo?: TipoSistemaBombeo
  tipoBombaActiva?: TipoBomba
  busqueda?: string
}) {
  const current = {
    estado: estadoActivo,
    tipoSistema: tipoSistemaActivo,
    tipoBomba: tipoBombaActiva,
    q: busqueda,
  }

  const estados: { valor: EstadoCotizacionBombeo | ''; label: string }[] = [
    { valor: '', label: 'Todos' },
    { valor: 'borrador', label: 'Borrador' },
    { valor: 'enviada', label: 'Enviada' },
    { valor: 'aprobada', label: 'Aprobada' },
    { valor: 'en_instalacion', label: 'En instalación' },
    { valor: 'completada', label: 'Completada' },
    { valor: 'rechazada', label: 'Rechazada' },
  ]

  const sistemas: { valor: TipoSistemaBombeo | ''; label: string }[] = [
    { valor: '', label: 'Todos' },
    { valor: 'solar_directo', label: 'Directo' },
    { valor: 'solar_vfd', label: 'VFD' },
    { valor: 'electrico', label: 'Eléctrico' },
  ]

  const bombas: { valor: TipoBomba | ''; label: string }[] = [
    { valor: '', label: 'Todas' },
    { valor: 'sumergible', label: 'Sumergible' },
    { valor: 'superficial', label: 'Superficial' },
  ]

  return (
    <div className="flex flex-col gap-3 mb-5">
      <form className="flex-1">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por cliente o número..."
          className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </form>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mr-1">Estado</span>
          {estados.map((e) => (
            <Link
              key={e.valor}
              href={buildUrl(current, { estado: e.valor || undefined })}
              className={`${CHIP_BASE} ${(estadoActivo ?? '') === e.valor ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {e.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mr-1">Sistema</span>
          {sistemas.map((s) => (
            <Link
              key={s.valor}
              href={buildUrl(current, { tipoSistema: s.valor || undefined })}
              className={`${CHIP_BASE} ${(tipoSistemaActivo ?? '') === s.valor ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mr-1">Bomba</span>
          {bombas.map((b) => (
            <Link
              key={b.valor}
              href={buildUrl(current, { tipoBomba: b.valor || undefined })}
              className={`${CHIP_BASE} ${(tipoBombaActiva ?? '') === b.valor ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {b.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function TablaBombeo({
  cotizaciones,
}: {
  cotizaciones: (CotizacionBombeo & { clientes: { nombre: string } | null })[]
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="hidden md:grid grid-cols-[1fr_140px_110px_90px_120px_110px_90px_24px] gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <HeaderCell>Cliente / Número</HeaderCell>
        <HeaderCell>Sistema</HeaderCell>
        <HeaderCell>Bomba</HeaderCell>
        <HeaderCell align="right">HP</HeaderCell>
        <HeaderCell align="right">Total USD</HeaderCell>
        <HeaderCell>Estado</HeaderCell>
        <HeaderCell>Fecha</HeaderCell>
        <span />
      </div>

      <div className="divide-y divide-[var(--border)]">
        {cotizaciones.map((cotizacion) => (
          <Link
            key={cotizacion.id}
            href={`/bombeo/${cotizacion.id}`}
            className="group block hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="md:hidden px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text)] truncate">
                  {cotizacion.clientes?.nombre ?? 'Sin cliente'}
                </p>
                <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mt-0.5">
                  {cotizacion.numero_cotizacion}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-[var(--text-2)]">{ETIQUETAS_SISTEMA[cotizacion.tipo_sistema]}</span>
                  <span className="text-[var(--text-3)]">/</span>
                  <span className="text-[11px] text-[var(--text-2)]">{ETIQUETAS_BOMBA[cotizacion.tipo_bomba]}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <EstadoBombeoBadge estado={cotizacion.estado} />
                <span className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                  {formatearUSD(cotizacion.total_usd)}
                </span>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-[1fr_140px_110px_90px_120px_110px_90px_24px] gap-4 px-4 py-3 items-center">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text)] truncate">
                  {cotizacion.clientes?.nombre ?? 'Sin cliente'}
                </p>
                <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                  {cotizacion.numero_cotizacion}
                </p>
              </div>
              <p className="text-[12px] text-[var(--text-2)]">{ETIQUETAS_SISTEMA[cotizacion.tipo_sistema]}</p>
              <p className="text-[12px] text-[var(--text-2)]">{ETIQUETAS_BOMBA[cotizacion.tipo_bomba]}</p>
              <p className="text-right font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                {formatearNumero(cotizacion.potencia_hp, 1)}
              </p>
              <p className="text-right font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                {formatearUSD(cotizacion.total_usd)}
              </p>
              <EstadoBombeoBadge estado={cotizacion.estado} />
              <p className="text-[11px] text-[var(--text-3)]">
                {new Date(cotizacion.created_at).toLocaleDateString('es-DO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function HeaderCell({
  children,
  align,
}: {
  children: ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <p
      className={`text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {children}
    </p>
  )
}

function EstadoVacio({ tieneFiltros }: { tieneFiltros: boolean }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <Waves className="h-8 w-8 text-[var(--text-3)] mx-auto mb-3" />
      <p className="text-[14px] font-medium text-[var(--text)]">
        {tieneFiltros ? 'Sin resultados' : 'Sin cotizaciones aún'}
      </p>
      <p className="text-[13px] text-[var(--text-3)] mt-1 mb-4">
        {tieneFiltros
          ? 'Ninguna cotización coincide con los filtros aplicados.'
          : 'Crea tu primera cotización de bombeo para comenzar.'}
      </p>
      {!tieneFiltros && (
        <Link href="/bombeo/nueva">
          <Button variant="accent" size="md">
            <Plus className="h-3.5 w-3.5" />
            Nueva cotización
          </Button>
        </Link>
      )}
    </div>
  )
}
