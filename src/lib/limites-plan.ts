import { LIMITES_PLAN } from '@/lib/permisos'
import { createClient } from '@/lib/supabase/server'

export async function verificarLimiteCotizacionesMes(empresaId: string) {
  const supabase = createClient()

  const { data: empresa } = await supabase
    .from('empresas')
    .select('plan_actual')
    .eq('id', empresaId)
    .maybeSingle()

  const planActual = (empresa?.plan_actual ?? 'basico') as keyof typeof LIMITES_PLAN
  const limite = LIMITES_PLAN[planActual].cotizaciones_mes

  if (!Number.isFinite(limite)) {
    return { ok: true }
  }

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const desde = inicioMes.toISOString()

  const [solar, bombeo, electrico] = await Promise.all([
    supabase
      .from('cotizaciones')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .gte('created_at', desde),
    supabase
      .from('cotizaciones_bombeo')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .gte('created_at', desde),
    supabase
      .from('cotizaciones_electricas')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .gte('created_at', desde),
  ])

  const totalMes = (solar.count ?? 0) + (bombeo.count ?? 0) + (electrico.count ?? 0)

  if (totalMes >= limite) {
    return {
      ok: false,
      error: `Tu plan basico permite ${limite} cotizaciones por mes. Actualiza el plan para seguir creando propuestas.`,
    }
  }

  return { ok: true }
}
