import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { formatearUSD } from '@/lib/calculos'
import { diasVencida, diasParaVencer } from '@/lib/cobros'
import type { EstadoCuota } from '@/types/cobros'

interface CuotaRow {
  id: string
  plan_id: string
  orden: number
  porcentaje: number
  monto_usd: number
  condicion: string
  fecha_limite: string | null
  estado: EstadoCuota
  fecha_pago: string | null
  planes_pago: {
    id: string
    numero_cotizacion: string
    cliente_nombre: string
    cotizacion_tipo: string
    total_usd: number
  } | null
}

interface SearchParams {
  estado?: string
}

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()
  if (!empresaId) redirect('/configuracion')

  // Actualizar estados vencidos antes de renderizar
  await supabase.rpc('actualizar_cuotas_vencidas', { p_empresa_id: empresaId })

  let query = supabase
    .from('plan_pago_cuotas')
    .select(
      `id, plan_id, orden, porcentaje, monto_usd, condicion, fecha_limite, estado, fecha_pago,
       planes_pago!inner(id, numero_cotizacion, cliente_nombre, cotizacion_tipo, total_usd)`
    )
    .neq('estado', 'cancelado')

  if (searchParams.estado && searchParams.estado !== 'todas') {
    query = query.eq('estado', searchParams.estado)
  }

  const { data } = await query.limit(300)
  const cuotas = (data ?? []) as unknown as CuotaRow[]

  // Ordenar: vencidas primero, luego pendientes con fecha, luego sin fecha, luego pagadas
  const prioridad = (c: CuotaRow) => {
    if (c.estado === 'vencido') return 0
    if (c.estado === 'pendiente' && c.fecha_limite) return 1
    if (c.estado === 'pendiente') return 2
    return 3
  }
  const ordenadas = [...cuotas].sort((a, b) => {
    const pa = prioridad(a)
    const pb = prioridad(b)
    if (pa !== pb) return pa - pb
    if (a.fecha_limite && b.fecha_limite) {
      return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime()
    }
    return 0
  })

  // Métricas simples
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)

  const porCobrarMes = cuotas
    .filter(
      (c) =>
        c.estado !== 'pagado' &&
        c.fecha_limite &&
        new Date(c.fecha_limite) >= inicioMes &&
        new Date(c.fecha_limite) <= finMes
    )
    .reduce((acc, c) => acc + c.monto_usd, 0)

  const cobradoMes = cuotas
    .filter(
      (c) =>
        c.estado === 'pagado' &&
        c.fecha_pago &&
        new Date(c.fecha_pago) >= inicioMes
    )
    .reduce((acc, c) => acc + c.monto_usd, 0)

  const vencidasCount = cuotas.filter((c) => c.estado === 'vencido').length

  const filtros: { valor: string; label: string }[] = [
    { valor: 'todas', label: 'Todas' },
    { valor: 'pendiente', label: 'Pendiente' },
    { valor: 'vencido', label: 'Vencida' },
    { valor: 'pagado', label: 'Pagada' },
  ]

  const estadoActivo = searchParams.estado ?? 'todas'

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">Cobros</h1>
        <p className="text-[13px] text-[var(--text-3)] mt-0.5">
          Seguimiento de cuotas y pagos por proyecto
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricaCobroCard
          label="Por cobrar este mes"
          valor={formatearUSD(porCobrarMes)}
          acento="amber"
        />
        <MetricaCobroCard
          label="Cobrado este mes"
          valor={formatearUSD(cobradoMes)}
          acento="green"
        />
        <MetricaCobroCard
          label="Cuotas vencidas"
          valor={String(vencidasCount)}
          acento={vencidasCount > 0 ? 'red' : 'default'}
        />
      </div>

      {/* Banner vencidas */}
      {vencidasCount > 0 && (
        <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius)] p-4">
          <p className="text-[13px] font-medium text-[var(--red)]">
            {vencidasCount} {vencidasCount === 1 ? 'cuota vencida' : 'cuotas vencidas'}
          </p>
          <p className="text-[12px] text-[var(--red)] mt-0.5">
            Registra los pagos o coordina con los clientes correspondientes.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-1 flex-wrap items-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mr-1">
          Estado
        </span>
        {filtros.map((f) => (
          <Link
            key={f.valor}
            href={f.valor === 'todas' ? '/cobros' : `/cobros?estado=${f.valor}`}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors ${
              estadoActivo === f.valor
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'bg-[var(--surface)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      {ordenadas.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-12 text-center">
          <p className="text-[14px] font-medium text-[var(--text)]">Sin cuotas</p>
          <p className="text-[13px] text-[var(--text-3)] mt-1">
            Los planes de cobro aparecen aquí cuando apruebas una cotización.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Header desktop */}
          <div className="hidden md:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_120px_100px_80px_110px] gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
            {['Cliente / Proyecto', 'Condición', 'Monto', 'Fecha límite', '% cuota', 'Estado', 'Acción'].map(
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
            {ordenadas.map((cuota) => {
              const plan = cuota.planes_pago
              if (!plan) return null

              const esVencida = cuota.estado === 'vencido'
              const esProxima =
                cuota.estado === 'pendiente' &&
                cuota.fecha_limite &&
                diasParaVencer(cuota.fecha_limite) <= 7 &&
                diasParaVencer(cuota.fecha_limite) >= 0

              return (
                <div
                  key={cuota.id}
                  className={`transition-colors ${
                    esVencida
                      ? 'bg-[var(--red-bg)]'
                      : esProxima
                      ? 'bg-[var(--accent-bg)]'
                      : 'hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {/* Mobile */}
                  <div className="md:hidden px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text)] truncate">
                        {plan.cliente_nombre}
                      </p>
                      <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mt-0.5">
                        {plan.numero_cotizacion} · cuota {cuota.orden}
                      </p>
                      <p className="text-[12px] text-[var(--text-2)] mt-0.5">{cuota.condicion}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <EstadoCuotaBadge estado={cuota.estado} />
                      <span className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                        {formatearUSD(cuota.monto_usd)}
                      </span>
                      {cuota.estado !== 'pagado' && (
                        <Link
                          href={`/cobros/${plan.id}`}
                          className="text-[11px] text-[var(--accent)] font-medium"
                        >
                          Ver plan →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_120px_100px_80px_110px] gap-4 px-4 py-3 items-center">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text)] truncate">
                        {plan.cliente_nombre}
                      </p>
                      <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)] truncate">
                        {plan.numero_cotizacion} · cuota {cuota.orden}
                      </p>
                    </div>
                    <p className="text-[12px] text-[var(--text-2)] truncate">{cuota.condicion}</p>
                    <p className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)] text-right">
                      {formatearUSD(cuota.monto_usd)}
                    </p>
                    <div>
                      {cuota.fecha_limite ? (
                        <p
                          className={`text-[12px] font-[family-name:var(--font-mono)] ${
                            esVencida
                              ? 'text-[var(--red)] font-medium'
                              : esProxima
                              ? 'text-[var(--accent)] font-medium'
                              : 'text-[var(--text-3)]'
                          }`}
                        >
                          {new Date(cuota.fecha_limite).toLocaleDateString('es-DO', {
                            day: '2-digit',
                            month: 'short',
                          })}
                          {esVencida && (
                            <span className="ml-1 text-[10px]">
                              ({diasVencida(cuota.fecha_limite)}d atrás)
                            </span>
                          )}
                          {esProxima && (
                            <span className="ml-1 text-[10px]">
                              ({diasParaVencer(cuota.fecha_limite!)}d)
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-[12px] text-[var(--text-3)]">—</p>
                      )}
                    </div>
                    <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--text-3)] text-right">
                      {cuota.porcentaje}%
                    </p>
                    <EstadoCuotaBadge estado={cuota.estado} />
                    <Link
                      href={`/cobros/${plan.id}`}
                      className="text-[12px] text-[var(--accent)] font-medium hover:underline"
                    >
                      Ver plan →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricaCobroCard({
  label,
  valor,
  acento,
}: {
  label: string
  valor: string
  acento: 'default' | 'amber' | 'green' | 'red'
}) {
  const acentoClase = {
    default: 'bg-[var(--surface-2)]',
    amber: 'bg-[var(--accent)] opacity-80',
    green: 'bg-[var(--green)]',
    red: 'bg-[var(--red)]',
  }[acento]

  return (
    <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[var(--radius)] ${acentoClase}`} />
      <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)] mb-2">
        {label}
      </p>
      <p className="text-[24px] font-[300] text-[var(--text)] tracking-[-0.03em]">{valor}</p>
    </div>
  )
}

function EstadoCuotaBadge({ estado }: { estado: EstadoCuota }) {
  const clases = {
    pendiente: 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border-s)]',
    pagado: 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green)]/20',
    vencido: 'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red)]/20',
    cancelado: 'bg-[var(--surface-2)] text-[var(--text-3)] border-[var(--border-s)]',
  }[estado]

  const labels = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    vencido: 'Vencida',
    cancelado: 'Cancelado',
  }[estado]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${clases}`}
    >
      {labels}
    </span>
  )
}
