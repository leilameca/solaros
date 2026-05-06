import { Badge } from '@/components/ui/badge'
import {
  capitalizarPlan,
  ETIQUETAS_ESTADO_SUSCRIPCION,
  formatearFechaLargaConfiguracion,
  formatearUSDConfiguracion,
  PLANES_SOLAR_OS,
} from '@/lib/configuracion'
import type { EmpresaConfiguracion } from '@/types/configuracion'

export function TabSuscripcion({ empresa }: { empresa: EmpresaConfiguracion }) {
  const diasRestantes = empresa.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(empresa.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  const badgeVariant =
    empresa.suscripcion_estado === 'activa'
      ? 'success'
      : empresa.suscripcion_estado === 'trial'
        ? 'warning'
        : 'danger'

  const accionPrincipal =
    empresa.suscripcion_estado === 'trial'
      ? 'Activar plan'
      : empresa.plan_actual === 'basico'
        ? 'Actualizar a Pro'
        : empresa.plan_actual === 'pro'
          ? 'Ver facturacion'
          : null

  return (
    <div className="space-y-4">
      {empresa.suscripcion_estado === 'trial' ? (
        <div className="bg-[var(--accent-bg)] border border-[var(--accent-bd)] rounded-[var(--radius)] p-4">
          <p className="text-[13px] font-medium text-[var(--accent)]">
            Periodo de prueba - {diasRestantes} dias restantes
          </p>
          <p className="text-[12px] text-[var(--text-2)] mt-1">
            Todos los planes incluyen 3 meses gratis. Activa el tuyo antes del {formatearFechaLargaConfiguracion(empresa.trial_ends_at)} para no perder el acceso.
          </p>
        </div>
      ) : null}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
              Plan actual
            </p>
            <p className="text-[24px] font-[500] text-[var(--text)] mt-1">
              {capitalizarPlan(empresa.plan_actual)}
            </p>
          </div>
          <Badge variant={badgeVariant}>{ETIQUETAS_ESTADO_SUSCRIPCION[empresa.suscripcion_estado]}</Badge>
        </div>

        <p className="text-[13px] text-[var(--text-2)] mt-3">
          {empresa.suscripcion_renueva_en
            ? `Proximo cobro: ${formatearFechaLargaConfiguracion(empresa.suscripcion_renueva_en)} - ${formatearUSDConfiguracion(empresa.suscripcion_monto_usd)} USD`
            : `Monto de referencia: ${formatearUSDConfiguracion(empresa.suscripcion_monto_usd)} USD · plan ${capitalizarPlan(empresa.plan_actual)}`}
        </p>

        {accionPrincipal ? (
          <button className="mt-4 bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium tracking-[-0.01em] hover:opacity-90 transition-opacity">
            {accionPrincipal}
          </button>
        ) : null}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
                <th className="px-4 py-3">Caracteristica</th>
                <th className="px-4 py-3">Basico $10</th>
                <th className="px-4 py-3">Pro $20</th>
                <th className="px-4 py-3">Enterprise $40</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[var(--text)]">
              <FilaPlan label="Usuarios" basico="1" pro="5" enterprise="Ilimitados" />
              <FilaPlan
                label="Cotizaciones/mes"
                basico={PLANES_SOLAR_OS.basico.cotizacionesMes}
                pro={PLANES_SOLAR_OS.pro.cotizacionesMes}
                enterprise={PLANES_SOLAR_OS.enterprise.cotizacionesMes}
              />
              <FilaPlan
                label="Modulo bombeo"
                basico={PLANES_SOLAR_OS.basico.incluyeBombeo}
                pro={PLANES_SOLAR_OS.pro.incluyeBombeo}
                enterprise={PLANES_SOLAR_OS.enterprise.incluyeBombeo}
              />
              <FilaPlan
                label="Inventario"
                basico={PLANES_SOLAR_OS.basico.incluyeInventario}
                pro={PLANES_SOLAR_OS.pro.incluyeInventario}
                enterprise={PLANES_SOLAR_OS.enterprise.incluyeInventario}
              />
              <FilaPlan
                label="Propuestas PDF/mes"
                basico={PLANES_SOLAR_OS.basico.propuestasMes}
                pro={PLANES_SOLAR_OS.pro.propuestasMes}
                enterprise={PLANES_SOLAR_OS.enterprise.propuestasMes}
              />
              <FilaPlan label="Soporte" basico="Email" pro="Prioritario" enterprise="Dedicado" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FilaPlan({
  label,
  basico,
  pro,
  enterprise,
}: {
  label: string
  basico: string
  pro: string
  enterprise: string
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-4 py-3 text-[var(--text-2)]">{label}</td>
      <td className="px-4 py-3">{basico}</td>
      <td className="px-4 py-3">{pro}</td>
      <td className="px-4 py-3">{enterprise}</td>
    </tr>
  )
}
