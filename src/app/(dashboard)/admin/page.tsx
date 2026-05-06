import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLANES_SOLAR_OS, capitalizarPlan, formatearUSDConfiguracion } from '@/lib/configuracion'
import { SUPERADMIN_EMAIL } from '@/lib/permisos'
import { createClient } from '@/lib/supabase/server'
import { AdminEmpresasTable } from '@/components/admin/AdminEmpresasTable'
import type { EstadoSuscripcionEmpresa, PlanSuscripcionEmpresa } from '@/types/configuracion'

export default async function AdminPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || (user.email ?? '').toLowerCase() !== SUPERADMIN_EMAIL.toLowerCase()) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  const [{ data: empresas }, { data: usuarios }, solar, bombeo, electrico] = await Promise.all([
    admin
      .from('empresas')
      .select(
        'id, nombre_empresa, plan_actual, suscripcion_estado, trial_ends_at, suscripcion_renueva_en'
      )
      .order('created_at', { ascending: false }),
    admin.from('usuarios').select('empresa_id'),
    admin.from('cotizaciones').select('empresa_id, created_at'),
    admin.from('cotizaciones_bombeo').select('empresa_id, created_at'),
    admin.from('cotizaciones_electrico').select('empresa_id, created_at'),
  ])

  const usuariosPorEmpresa = new Map<string, number>()
  for (const usuarioRow of usuarios ?? []) {
    const empresaId = usuarioRow.empresa_id
    if (!empresaId) continue
    usuariosPorEmpresa.set(empresaId, (usuariosPorEmpresa.get(empresaId) ?? 0) + 1)
  }

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const cotizacionesPorEmpresa = new Map<string, number>()
  for (const fila of [...(solar.data ?? []), ...(bombeo.data ?? []), ...(electrico.data ?? [])]) {
    const empresaId = fila.empresa_id
    if (!empresaId) continue
    if (new Date(fila.created_at).getTime() < inicioMes.getTime()) continue
    cotizacionesPorEmpresa.set(empresaId, (cotizacionesPorEmpresa.get(empresaId) ?? 0) + 1)
  }

  const empresasRows = (empresas ?? []).map((empresa) => ({
    id: empresa.id,
    nombre_empresa: empresa.nombre_empresa ?? 'Empresa sin nombre',
    plan_actual: (empresa.plan_actual ?? 'basico') as PlanSuscripcionEmpresa,
    suscripcion_estado: (empresa.suscripcion_estado ?? 'trial') as EstadoSuscripcionEmpresa | 'suspendida',
    trial_ends_at: empresa.trial_ends_at ?? null,
    suscripcion_renueva_en: empresa.suscripcion_renueva_en ?? null,
    usuarios_count: usuariosPorEmpresa.get(empresa.id) ?? 0,
    cotizaciones_mes: cotizacionesPorEmpresa.get(empresa.id) ?? 0,
  }))

  const totalEmpresas = empresasRows.length
  const trial = empresasRows.filter((empresa) => empresa.suscripcion_estado === 'trial').length
  const activas = empresasRows.filter((empresa) => empresa.suscripcion_estado === 'activa').length
  const vencidas = empresasRows.filter((empresa) => empresa.suscripcion_estado === 'vencida').length
  const suspendidas = empresasRows.filter((empresa) => empresa.suscripcion_estado === 'suspendida').length
  const mrr = empresasRows
    .filter((empresa) => empresa.suscripcion_estado === 'activa')
    .reduce((acc, empresa) => acc + PLANES_SOLAR_OS[empresa.plan_actual].precioUsd, 0)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[24px] font-medium text-[var(--text)] tracking-[-0.03em]">
          Panel super admin
        </h1>
        <p className="text-[13px] text-[var(--text-3)]">
          Vista global del SaaS para {SUPERADMIN_EMAIL}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard label="Empresas" value={String(totalEmpresas)} />
        <MetricCard label="Activas" value={String(activas)} />
        <MetricCard label="En trial" value={String(trial)} />
        <MetricCard label="Vencidas / suspendidas" value={`${vencidas} / ${suspendidas}`} />
        <MetricCard label="MRR estimado" value={formatearUSDConfiguracion(mrr)} />
      </div>

      <AdminEmpresasTable empresas={empresasRows} />
    </div>
  )
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)] mb-2">
        {label}
      </p>
      <p className="text-[28px] font-[300] text-[var(--text)] tracking-[-0.03em]">
        {value}
      </p>
    </div>
  )
}
