import { createClient, obtenerConfigEmpresa } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { BotonGenerarPDF } from '@/components/pdf/BotonGenerarPDF'
import { formatearRD2, ITBIS_RATE } from '@/lib/calculos-electrico'
import { CambiarEstadoElectrico } from '@/components/electrico/CambiarEstadoElectrico'
import type {
  CotizacionElectrica,
  ItemElectricoDB,
  EstadoCotizacionElectrica,
} from '@/types/electrico'
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

export default async function DetalleElectricoPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [
    { data: cotizacion, error },
    { data: itemsData },
    empresaConfig,
  ] = await Promise.all([
    supabase
      .from('cotizaciones_electricas')
      .select(
        `*,
         clientes(nombre, telefono, email),
         cotizaciones(numero_cotizacion),
         cotizaciones_bombeo(numero_cotizacion)`
      )
      .eq('id', params.id)
      .single(),
    supabase
      .from('items_cotizacion_electrica')
      .select('*')
      .eq('cotizacion_id', params.id)
      .order('orden'),
    obtenerConfigEmpresa(),
  ])

  if (error || !cotizacion) notFound()

  const cot = cotizacion as unknown as CotizacionElectrica & {
    clientes: { nombre: string; telefono: string | null; email: string | null } | null
    cotizaciones: { numero_cotizacion: string } | null
    cotizaciones_bombeo: { numero_cotizacion: string } | null
  }
  const items = (itemsData ?? []) as ItemElectricoDB[]

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/electrico"
            className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
                {cot.numero_cotizacion}
              </h1>
              <Badge variant={ESTADO_VARIANT[cot.estado]}>
                {ETIQUETAS_ESTADO_ELECTRICO[cot.estado]}
              </Badge>
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
          <CambiarEstadoElectrico
            cotizacionId={cot.id}
            estadoActual={cot.estado}
          />
          {empresaConfig && (
            <BotonGenerarPDF
              tipo="electrico"
              empresaId={empresaConfig.id}
              datos={{
                cotizacion: cot,
                items,
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

      {/* Grid contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda */}
        <div className="lg:col-span-1 space-y-4">
          {/* Cliente */}
          <SeccionCard titulo="Cliente">
            <FilaDato
              label="Nombre"
              valor={cot.clientes?.nombre ?? '—'}
            />
            {cot.clientes?.telefono && (
              <FilaDato label="Teléfono" valor={cot.clientes.telefono} />
            )}
            {cot.clientes?.email && (
              <FilaDato label="Email" valor={cot.clientes.email} />
            )}
          </SeccionCard>

          {/* Servicio */}
          <SeccionCard titulo="Servicio">
            <FilaDato label="Tipo de trabajo" valor={cot.tipo_trabajo} />
            {cot.descripcion && (
              <div className="pt-1">
                <span className="text-[12px] text-[var(--text-3)] block mb-1">
                  Descripción
                </span>
                <p className="text-[12px] text-[var(--text)] leading-relaxed">
                  {cot.descripcion}
                </p>
              </div>
            )}
          </SeccionCard>

          {/* Vinculaciones */}
          {(cot.cotizaciones || cot.cotizaciones_bombeo) && (
            <SeccionCard titulo="Vinculaciones">
              {cot.cotizaciones && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-[var(--text-3)]">
                    Cotización solar
                  </span>
                  <Link
                    href={`/cotizaciones/${cot.cotizacion_solar_id}`}
                    className="flex items-center gap-1 text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
                  >
                    {cot.cotizaciones.numero_cotizacion}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
              {cot.cotizaciones_bombeo && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-[var(--text-3)]">
                    Cotización bombeo
                  </span>
                  <Link
                    href={`/bombeo/${cot.cotizacion_bombeo_id}`}
                    className="flex items-center gap-1 text-[12px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
                  >
                    {cot.cotizaciones_bombeo.numero_cotizacion}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </SeccionCard>
          )}

          {/* Notas */}
          {cot.notas && (
            <SeccionCard titulo="Notas">
              <p className="text-[12px] text-[var(--text-2)] leading-relaxed">
                {cot.notas}
              </p>
            </SeccionCard>
          )}
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-4">
          {/* Métricas financieras */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TarjetaMetrica
              label="Total RD$"
              valor={`RD$ ${formatearRD2(cot.total_rd)}`}
              destaca
            />
            <TarjetaMetrica
              label="Total USD"
              valor={`$ ${cot.total_usd.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />
            <TarjetaMetrica
              label="Materiales"
              valor={`RD$ ${formatearRD2(cot.subtotal_materiales_rd)}`}
            />
            <TarjetaMetrica
              label="Mano de obra"
              valor={`RD$ ${formatearRD2(cot.mano_obra_rd)}`}
            />
          </div>

          {/* Tabla de materiales */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                Materiales — {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            </div>

            {items.length === 0 ? (
              <p className="text-[13px] text-[var(--text-3)] text-center py-6">
                Sin materiales registrados
              </p>
            ) : (
              <>
                {/* Header tabla desktop */}
                <div className="hidden md:grid grid-cols-[1fr_80px_90px_120px_110px_120px] gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  {['Descripción', 'Unidad', 'Cant.', 'P. Unit RD$', 'Subtotal', 'Total c/ITBIS'].map(
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
                  {items.map((item) => {
                    const subtotal = item.precio_unit_rd * item.cantidad
                    const total = subtotal * (1 + ITBIS_RATE)
                    return (
                      <div key={item.id}>
                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-[1fr_80px_90px_120px_110px_120px] gap-3 px-4 py-2.5 items-center">
                          <p className="text-[13px] text-[var(--text)]">
                            {item.descripcion}
                          </p>
                          <p className="text-[12px] text-[var(--text-2)]">
                            {item.unidad}
                          </p>
                          <p className="text-[12px] font-[family-name:var(--font-mono)] text-right text-[var(--text)]">
                            {item.cantidad.toLocaleString('es-DO')}
                          </p>
                          <p className="text-[12px] font-[family-name:var(--font-mono)] text-right text-[var(--text)]">
                            {formatearRD2(item.precio_unit_rd)}
                          </p>
                          <p className="text-[12px] font-[family-name:var(--font-mono)] text-right text-[var(--text-2)]">
                            {formatearRD2(subtotal)}
                          </p>
                          <p className="text-[12px] font-[family-name:var(--font-mono)] text-right font-medium text-[var(--text)]">
                            {formatearRD2(total)}
                          </p>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] text-[var(--text)] flex-1">
                              {item.descripcion}
                            </p>
                            <p className="text-[13px] font-[family-name:var(--font-mono)] font-medium text-[var(--text)] flex-shrink-0">
                              RD$ {formatearRD2(total)}
                            </p>
                          </div>
                          <p className="text-[11px] text-[var(--text-3)] font-[family-name:var(--font-mono)] mt-0.5">
                            {item.cantidad} {item.unidad} × RD${' '}
                            {formatearRD2(item.precio_unit_rd)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer: resumen */}
                <div className="border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-3)]">Subtotal materiales</span>
                    <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">
                      RD$ {formatearRD2(cot.subtotal_materiales_rd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-3)]">ITBIS 18%</span>
                    <span className="font-[family-name:var(--font-mono)] text-[var(--text-3)]">
                      RD$ {formatearRD2(cot.itbis_rd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-3)]">Mano de obra</span>
                    <span className="font-[family-name:var(--font-mono)] text-[var(--text)]">
                      RD$ {formatearRD2(cot.mano_obra_rd)}
                    </span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between">
                    <span className="text-[13px] font-medium text-[var(--text)]">
                      Total
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[15px] font-medium text-[var(--text)]">
                      RD$ {formatearRD2(cot.total_rd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[12px] text-[var(--text-3)]">
                      Equivalente USD (tasa {cot.tasa_dolar})
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[13px] font-medium text-[var(--accent)]">
                      ${' '}
                      {cot.total_usd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Subcomponentes

function SeccionCard({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
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

function TarjetaMetrica({
  label,
  valor,
  destaca,
}: {
  label: string
  valor: string
  destaca?: boolean
}) {
  return (
    <div
      className={`rounded-[var(--radius)] p-3 border shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${
        destaca
          ? 'bg-[var(--accent-bg)] border-[var(--accent-bd)]'
          : 'bg-[var(--surface)] border-[var(--border)]'
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
        {label}
      </p>
      <p
        className={`font-[family-name:var(--font-mono)] text-[13px] font-medium ${
          destaca ? 'text-[var(--accent)]' : 'text-[var(--text)]'
        }`}
      >
        {valor}
      </p>
    </div>
  )
}
