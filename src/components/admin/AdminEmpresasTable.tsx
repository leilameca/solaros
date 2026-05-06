'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { actualizarEmpresaAdmin } from '@/app/(dashboard)/admin/actions'
import { capitalizarPlan, formatearFechaLargaConfiguracion } from '@/lib/configuracion'
import { PLANES_SOLAR_OS } from '@/lib/configuracion'
import type { EstadoSuscripcionEmpresa, PlanSuscripcionEmpresa } from '@/types/configuracion'

interface EmpresaAdminRow {
  id: string
  nombre_empresa: string
  plan_actual: PlanSuscripcionEmpresa
  suscripcion_estado: EstadoSuscripcionEmpresa | 'suspendida'
  trial_ends_at: string | null
  suscripcion_renueva_en: string | null
  usuarios_count: number
  cotizaciones_mes: number
}

export function AdminEmpresasTable({
  empresas,
}: {
  empresas: EmpresaAdminRow[]
}) {
  const [feedback, setFeedback] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {feedback ? (
        <div className="bg-[var(--blue-bg)] border border-[var(--blue)] rounded-[var(--radius)] p-3 text-[12px] text-[var(--blue)]">
          {feedback}
        </div>
      ) : null}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Trial/Vence</th>
                <th className="px-4 py-3">Usuarios</th>
                <th className="px-4 py-3">Cotizaciones mes</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[var(--text)]">
              {empresas.map((empresa) => (
                <FilaEmpresa
                  key={empresa.id}
                  empresa={empresa}
                  onFeedback={setFeedback}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FilaEmpresa({
  empresa,
  onFeedback,
}: {
  empresa: EmpresaAdminRow
  onFeedback: (message: string | null) => void
}) {
  const [guardando, startTransition] = useTransition()
  const [plan, setPlan] = useState<PlanSuscripcionEmpresa>(empresa.plan_actual)
  const [estado, setEstado] = useState<EstadoSuscripcionEmpresa | 'suspendida'>(
    empresa.suscripcion_estado
  )

  const badgeVariant =
    estado === 'activa'
      ? 'success'
      : estado === 'trial'
        ? 'warning'
        : estado === 'suspendida'
          ? 'danger'
          : 'default'

  function guardarCambios() {
    startTransition(async () => {
      const resultado = await actualizarEmpresaAdmin({
        empresaId: empresa.id,
        plan_actual: plan,
        suscripcion_estado: estado,
      })

      if (resultado.error) {
        onFeedback(resultado.error)
        return
      }

      onFeedback(`Empresa actualizada: ${empresa.nombre_empresa}.`)
    })
  }

  return (
    <tr className="border-b border-[var(--border)] last:border-b-0 align-top">
      <td className="px-4 py-4">
        <p className="font-medium text-[var(--text)]">{empresa.nombre_empresa}</p>
        <p className="text-[11px] text-[var(--text-3)] mt-1">{empresa.id}</p>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2 min-w-[140px]">
          <Badge variant="info">{capitalizarPlan(plan)}</Badge>
          <Select value={plan} onValueChange={(valor) => setPlan(valor as PlanSuscripcionEmpresa)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basico">Basico</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-[var(--text-3)]">
            ${PLANES_SOLAR_OS[plan].precioUsd}/mes
          </p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2 min-w-[140px]">
          <Badge variant={badgeVariant}>
            {estado}
          </Badge>
          <Select value={estado} onValueChange={(valor) => setEstado(valor as EstadoSuscripcionEmpresa | 'suspendida')}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="activa">Activa</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
              <SelectItem value="suspendida">Suspendida</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </td>
      <td className="px-4 py-4 text-[12px] text-[var(--text-2)]">
        <p>Trial: {formatearFechaLargaConfiguracion(empresa.trial_ends_at)}</p>
        <p className="mt-1">Renueva: {formatearFechaLargaConfiguracion(empresa.suscripcion_renueva_en)}</p>
      </td>
      <td className="px-4 py-4 font-[family-name:var(--font-mono)]">{empresa.usuarios_count}</td>
      <td className="px-4 py-4 font-[family-name:var(--font-mono)]">{empresa.cotizaciones_mes}</td>
      <td className="px-4 py-4">
        <Button type="button" size="sm" variant="secondary" onClick={guardarCambios} loading={guardando}>
          Guardar
        </Button>
      </td>
    </tr>
  )
}
