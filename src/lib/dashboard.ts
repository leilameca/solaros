import { createClient } from '@/lib/supabase/server'
import type {
  CotizacionRecienteDashboard,
  DashboardData,
  MetricasDashboard,
  RolDashboard,
  UsuarioDashboard,
} from '@/types/dashboard'

interface MetricasRpcRow {
  cotizaciones_mes: number
  aprobadas_mes: number
  en_instalacion: number
  valor_pipeline: number
  valor_cerrado_mes: number
}

function inicioDelMesIso() {
  const ahora = new Date()
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  inicio.setHours(0, 0, 0, 0)
  return inicio.toISOString()
}

async function obtenerMetricasRpc(
  supabase: ReturnType<typeof createClient>,
  empresaId: string,
  inicioMes: string
): Promise<MetricasRpcRow | null> {
  const { data, error } = await supabase.rpc('metricas_dashboard', {
    p_empresa_id: empresaId,
    p_inicio_mes: inicioMes,
  })
  if (error || !data || !Array.isArray(data) || data.length === 0) return null
  return data[0] as MetricasRpcRow
}

async function obtenerUltimasCotizacionesRpc(
  supabase: ReturnType<typeof createClient>,
  empresaId: string
) {
  const { data, error } = await supabase.rpc('ultimas_cotizaciones', {
    p_empresa_id: empresaId,
    p_limit: 5,
  })

  if (!error && data) {
    return data as CotizacionRecienteDashboard[]
  }

  return null
}

async function obtenerStockBajo(
  supabase: ReturnType<typeof createClient>,
  empresaId: string
) {
  const { count } = await supabase
    .from('inventario_stock_bajo')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
  return count ?? 0
}

interface MetricasCobrosRow {
  por_cobrar_mes: number
  cobrado_mes: number
  vencidas_count: number
  proximas_count: number
}

async function obtenerMetricasCobros(
  supabase: ReturnType<typeof createClient>,
  empresaId: string
): Promise<MetricasCobrosRow> {
  const fallback = { por_cobrar_mes: 0, cobrado_mes: 0, vencidas_count: 0, proximas_count: 0 }
  try {
    const { data, error } = await supabase.rpc('metricas_cobros', { p_empresa_id: empresaId })
    if (error || !data || !Array.isArray(data) || data.length === 0) return fallback
    return data[0] as MetricasCobrosRow
  } catch {
    return fallback
  }
}

export async function obtenerMetricasDashboard(params: {
  userId: string
  userEmail?: string | null
}): Promise<DashboardData | null> {
  const supabase = createClient()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, empresa_id, nombre, email, rol')
    .eq('id', params.userId)
    .maybeSingle()

  const empresaId = usuario?.empresa_id ?? null

  if (!empresaId) {
    return null
  }

  const inicioMes = inicioDelMesIso()

  const [
    { count: clientesNuevos },
    metricasAgregadas,
    stockBajo,
    ultimasCotizaciones,
    metricasCobros,
  ] = await Promise.all([
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .gte('created_at', inicioMes),
    obtenerMetricasRpc(supabase, empresaId, inicioMes),
    obtenerStockBajo(supabase, empresaId),
    obtenerUltimasCotizacionesRpc(supabase, empresaId),
    obtenerMetricasCobros(supabase, empresaId),
  ])

  const usuarioActual: UsuarioDashboard = {
    id: usuario?.id ?? params.userId,
    nombre: usuario?.nombre ?? params.userEmail?.split('@')[0] ?? 'Equipo',
    email: usuario?.email ?? params.userEmail ?? '',
    rol: (usuario?.rol ?? 'vendedor') as RolDashboard,
  }

  const cotizacionesEsteMes = Number(metricasAgregadas?.cotizaciones_mes ?? 0)
  const aprobadasEsteMes = Number(metricasAgregadas?.aprobadas_mes ?? 0)

  const metricas: MetricasDashboard = {
    cotizacionesEsteMes,
    clientesNuevos: clientesNuevos ?? 0,
    aprobadasEsteMes,
    tasaConversion: cotizacionesEsteMes === 0
      ? 0
      : Number(((aprobadasEsteMes / cotizacionesEsteMes) * 100).toFixed(1)),
    valorPipelineUsd: Number(metricasAgregadas?.valor_pipeline ?? 0),
    valorCerradoMesUsd: Number(metricasAgregadas?.valor_cerrado_mes ?? 0),
    proyectosEnInstalacion: Number(metricasAgregadas?.en_instalacion ?? 0),
    stockBajo,
    cobrosPorCobrarMes: Number(metricasCobros.por_cobrar_mes),
    cobrosCobraadoMes: Number(metricasCobros.cobrado_mes),
    cobrosVencidas: Number(metricasCobros.vencidas_count),
  }

  let recientes = ultimasCotizaciones ?? []

  if (usuarioActual.rol === 'tecnico') {
    recientes = recientes
      .filter((cotizacion) => cotizacion.estado === 'en_instalacion')
      .slice(0, 5)
  }

  return {
    usuario: usuarioActual,
    metricas,
    ultimasCotizaciones: recientes,
  }
}
