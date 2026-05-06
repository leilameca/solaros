import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
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

async function obtenerMetricasRpc(empresaId: string, inicioMes: string): Promise<MetricasRpcRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('metricas_dashboard', {
    p_empresa_id: empresaId,
    p_inicio_mes: inicioMes,
  })
  if (error || !data || !Array.isArray(data) || data.length === 0) return null
  return data[0] as MetricasRpcRow
}

async function obtenerUltimasCotizacionesRpc(empresaId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('ultimas_cotizaciones', {
    p_empresa_id: empresaId,
    p_limit: 5,
  })

  if (!error && data) {
    return data as CotizacionRecienteDashboard[]
  }

  return null
}


async function obtenerStockBajo(empresaId: string) {
  const supabase = createClient()
  const { count } = await supabase
    .from('inventario_stock_bajo')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
  return count ?? 0
}


export async function obtenerMetricasDashboard(): Promise<DashboardData | null> {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()

  if (!empresaId) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const inicioMes = inicioDelMesIso()

  const [
    { data: usuario },
    { count: clientesNuevos },
    metricasAgregadas,
    stockBajo,
    ultimasCotizaciones,
  ] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre, email, rol')
      .eq('id', user.id)
      .single(),
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .gte('created_at', inicioMes),
    obtenerMetricasRpc(empresaId, inicioMes),
    obtenerStockBajo(empresaId),
    obtenerUltimasCotizacionesRpc(empresaId),
  ])

  const usuarioActual: UsuarioDashboard = {
    id: usuario?.id ?? user.id,
    nombre: usuario?.nombre ?? user.email?.split('@')[0] ?? 'Equipo',
    email: usuario?.email ?? user.email ?? '',
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
