import { createClient, obtenerConfigEmpresa } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BadgeEstado } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GraficoGeneracion } from '@/components/cotizaciones/GraficoGeneracion'
import { CambiarEstado } from '@/components/cotizaciones/CambiarEstado'
import { BotonGenerarPDF } from '@/components/pdf/BotonGenerarPDF'
import { formatearUSD, formatearRD, formatearNumero } from '@/lib/calculos'
import { ETIQUETAS_SISTEMA, ETIQUETAS_TARIFA, NOMBRES_MESES } from '@/lib/constants'
import type { Cotizacion, ConsumoMensual, EstadoCotizacion, TipoSistema, TipoTarifa } from '@/types/cotizaciones'
import { ChevronLeft, Edit } from 'lucide-react'

export default async function DetalleCotizacionPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [{ data: cotizacion, error }, consumoResult, empresaConfig] = await Promise.all([
    supabase
      .from('cotizaciones')
      .select('*, clientes(nombre, telefono, email, numero_contrato)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('cotizacion_consumo_mensual')
      .select('*')
      .eq('cotizacion_id', params.id)
      .order('mes'),
    obtenerConfigEmpresa(),
  ])

  if (error || !cotizacion) notFound()

  const cot = cotizacion as unknown as Cotizacion & {
    clientes: { nombre: string; telefono: string | null; email: string | null; numero_contrato: string | null } | null
  }
  const meses = (consumoResult.data ?? []) as ConsumoMensual[]

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/cotizaciones"
            className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
                {cot.numero_cotizacion}
              </h1>
              <BadgeEstado estado={cot.estado as EstadoCotizacion} />
            </div>
            <p className="text-[13px] text-[var(--text-3)] mt-0.5">
              {cot.clientes?.nombre ?? 'Sin cliente'} ·{' '}
              {new Date(cot.created_at).toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <CambiarEstado cotizacionId={cot.id} estadoActual={cot.estado as EstadoCotizacion} />
          <Link href={`/cotizaciones/${cot.id}/editar`}>
            <Button variant="secondary" size="sm">
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </Link>
          {empresaConfig && (
            <BotonGenerarPDF
              tipo="solar"
              empresaId={empresaConfig.id}
              datos={{
                cotizacion: cot,
                consumoMensual: meses,
                empresa: {
                  id: empresaConfig.id,
                  nombre_empresa: empresaConfig.nombre_empresa,
                  logo_url: empresaConfig.logo_url,
                  email: empresaConfig.email ?? null,
                  telefono: empresaConfig.telefono ?? null,
                  tasa_dolar: empresaConfig.tasa_dolar,
                },
              }}
            />
          )}
        </div>
      </div>

      {/* Contenido en grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Columna izquierda — Datos */}
        <div className="lg:col-span-1 space-y-4">

          {/* Info cliente */}
          <SeccionCard titulo="Cliente">
            <FilaDato label="Nombre" valor={cot.clientes?.nombre ?? '—'} />
            {cot.clientes?.telefono && (
              <FilaDato label="Teléfono" valor={cot.clientes.telefono} />
            )}
            <FilaDato label="Provincia" valor={cot.provincia} />
            <FilaDato
              label="Tarifa"
              valor={ETIQUETAS_TARIFA[cot.tarifa as TipoTarifa]?.split(' — ')[0] ?? cot.tarifa}
            />
            <FilaDato
              label="Sistema"
              valor={ETIQUETAS_SISTEMA[cot.tipo_sistema as TipoSistema]?.split(' (')[0] ?? cot.tipo_sistema}
            />
          </SeccionCard>

          {/* Técnico */}
          <SeccionCard titulo="Sistema solar">
            <FilaDatoMono label="KWp instalado" valor={cot.kwp_calculado} unidad="KWp" />
            <FilaDatoMono label="Horas sol/día" valor={cot.horas_sol} unidad="h/día" />
            <FilaDatoMono label="Consumo base" valor={cot.kwh_mensual} unidad="KWh" />
            <FilaDatoMono label="Generación mensual" valor={cot.generacion_mensual} unidad="KWh" />
            <FilaDatoMono label="Generación anual" valor={cot.generacion_anual} unidad="KWh" />
          </SeccionCard>

          {/* Equipo */}
          <SeccionCard titulo="Equipo">
            {cot.panel_marca && (
              <>
                <FilaDato
                  label="Panel"
                  valor={`${cot.panel_marca} ${cot.panel_modelo ?? ''}`}
                />
                <FilaDatoMono
                  label="Potencia panel"
                  valor={cot.panel_potencia_w ?? 0}
                  unidad="W"
                />
                <FilaDatoMono
                  label="Cantidad"
                  valor={cot.panel_cantidad ?? 0}
                  unidad="und"
                  sinDecimales
                />
              </>
            )}
            {cot.inversor_marca && (
              <>
                <Separator className="my-2" />
                <FilaDato
                  label="Inversor"
                  valor={`${cot.inversor_marca} ${cot.inversor_modelo ?? ''}`}
                />
                <FilaDatoMono
                  label="Potencia inversor"
                  valor={cot.inversor_kw ?? 0}
                  unidad="kW"
                />
              </>
            )}
          </SeccionCard>
        </div>

        {/* Columna derecha — Financiero + Gráfico */}
        <div className="lg:col-span-2 space-y-4">

          {/* Métricas financieras */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TarjetaMetrica
              label="Inversión total"
              valor={formatearUSD(cot.total_usd)}
              subtitulo={`$${cot.precio_wp}/Wp`}
              destaca
            />
            <TarjetaMetrica
              label="Ahorro mensual"
              valor={formatearRD(cot.ahorro_mensual_rd ?? 0)}
              subtitulo="RD$"
            />
            <TarjetaMetrica
              label="Ahorro anual"
              valor={formatearUSD(cot.ahorro_anual_usd ?? 0)}
              subtitulo="USD"
            />
            <TarjetaMetrica
              label="Retorno"
              valor={`${cot.retorno_sin_ley ?? '—'} años`}
              subtitulo={cot.ley_5707_activa ? `${cot.retorno_con_ley} con ley` : 'Sin ley 57-07'}
            />
          </div>

          {/* Ley 57-07 */}
          {cot.ley_5707_activa && cot.inversion_neta_usd && (
            <div className="bg-[var(--green-bg)] border border-[var(--green)] border-opacity-30 rounded-[var(--radius)] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--green)] font-[family-name:var(--font-mono)] mb-3">
                Ley 57-07 activa
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-[11px] text-[var(--text-3)] mb-1">Inversión total</p>
                  <p className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                    {formatearUSD(cot.total_usd)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-3)] mb-1">Descuento/año (×3)</p>
                  <p className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--green)]">
                    {formatearUSD((cot.total_usd * 0.38) / 3)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-3)] mb-1">Inversión neta</p>
                  <p className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--text)]">
                    {formatearUSD(cot.inversion_neta_usd)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-3)] mb-1">Retorno con ley</p>
                  <p className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--accent)]">
                    {cot.retorno_con_ley} años
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico */}
          {meses.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-4">
                Generación vs consumo — 12 meses
              </p>
              <GraficoGeneracion datos={meses} />
            </div>
          )}

          {/* Tabla mensual */}
          {meses.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                  Detalle mensual
                </p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {meses.map((m) => {
                  const balance = m.generacion_kwh - m.consumo_kwh
                  return (
                    <div
                      key={m.mes}
                      className="grid grid-cols-4 gap-3 px-4 py-2.5 text-[12px]"
                    >
                      <span className="font-[family-name:var(--font-mono)] font-medium text-[var(--text-2)] uppercase text-[10px] tracking-[0.06em] flex items-center">
                        {NOMBRES_MESES[m.mes - 1]}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[var(--blue)] text-right">
                        {formatearNumero(m.consumo_kwh, 0)}{' '}
                        <span className="text-[var(--text-3)] text-[10px]">KWh</span>
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[var(--green)] text-right">
                        {formatearNumero(m.generacion_kwh, 0)}{' '}
                        <span className="text-[var(--text-3)] text-[10px]">KWh</span>
                      </span>
                      <span
                        className={`font-[family-name:var(--font-mono)] text-right ${
                          balance >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'
                        }`}
                      >
                        {balance >= 0 ? '+' : ''}
                        {formatearNumero(balance, 0)}{' '}
                        <span className="text-[var(--text-3)] text-[10px]">KWh</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Leyenda */}
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-2)] grid grid-cols-4 gap-3 text-[10px] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                <span>Mes</span>
                <span className="text-right text-[var(--blue)]">Consumo</span>
                <span className="text-right text-[var(--green)]">Generación</span>
                <span className="text-right">Balance</span>
              </div>
            </div>
          )}

          {/* Notas */}
          {cot.notas && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
                Notas
              </p>
              <p className="text-[13px] text-[var(--text-2)] leading-relaxed">{cot.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Subcomponentes ---

function SeccionCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-2.5 border-b border-[var(--border)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          {titulo}
        </p>
      </div>
      <div className="p-4 space-y-2.5">{children}</div>
    </div>
  )
}

function FilaDato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[12px] text-[var(--text-3)] flex-shrink-0">{label}</span>
      <span className="text-[12px] text-[var(--text)] font-medium text-right">{valor}</span>
    </div>
  )
}

function FilaDatoMono({
  label,
  valor,
  unidad,
  sinDecimales,
}: {
  label: string
  valor: number
  unidad: string
  sinDecimales?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-[var(--text-3)] flex-shrink-0">{label}</span>
      <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--text)] font-medium">
        {sinDecimales ? valor : formatearNumero(valor, 2)}{' '}
        <span className="text-[var(--text-3)] text-[10px]">{unidad}</span>
      </span>
    </div>
  )
}

function TarjetaMetrica({
  label,
  valor,
  subtitulo,
  destaca,
}: {
  label: string
  valor: string
  subtitulo: string
  destaca?: boolean
}) {
  return (
    <div
      className={`rounded-[var(--radius)] p-3 border ${
        destaca
          ? 'bg-[var(--accent-bg)] border-[var(--accent-bd)]'
          : 'bg-[var(--surface)] border-[var(--border)]'
      } shadow-[0_1px_3px_rgba(0,0,0,0.05)]`}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
        {label}
      </p>
      <p
        className={`font-[family-name:var(--font-mono)] text-[14px] font-medium ${
          destaca ? 'text-[var(--accent)]' : 'text-[var(--text)]'
        }`}
      >
        {valor}
      </p>
      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{subtitulo}</p>
    </div>
  )
}
