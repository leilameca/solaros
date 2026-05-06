import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import type {
  CotizacionRecienteDashboard,
  DashboardData,
  MetricasDashboard,
  RolDashboard,
  TipoCotizacionDashboard,
  UsuarioDashboard,
} from '@/types/dashboard'

type TablaCotizacion = 'cotizaciones' | 'cotizaciones_bombeo' | 'cotizaciones_electrico'

interface CotizacionDashboardRow {
  id: string
  numero_cotizacion: string
  total_usd: number | null
  estado: string
  created_at: string
  updated_at: string
  clientes?: Array<{
    nombre: string
  }> | null
}

const TIPOS_LABEL: Record<TipoCotizacionDashboard, 'Solar' | 'Bombeo' | 'Electrico'> = {
  solar: 'Solar',
  bombeo: 'Bombeo',
  electrico: 'Electrico',
}

const ESTADOS_PIPELINE = new Set(['borrador', 'enviada'])
const ESTADOS_CERRADOS = new Set(['aprobada', 'en_instalacion', 'completada'])

function capitalizar(texto: string) {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function obtenerSaludo() {
  const ahora = new Date()
  const hora = ahora.getHours()

  if (hora < 12) return 'Buenos dias'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function obtenerFechaLarga() {
  const fecha = new Date().toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return capitalizar(fecha)
}

function inicioDelMesIso() {
  const ahora = new Date()
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  inicio.setHours(0, 0, 0, 0)
  return inicio.toISOString()
}

function normalizarMonto(valor: number | null) {
  return Number(valor ?? 0)
}

function tipoDesdeTabla(tabla: TablaCotizacion): TipoCotizacionDashboard {
  if (tabla === 'cotizaciones') return 'solar'
  if (tabla === 'cotizaciones_bombeo') return 'bombeo'
  return 'electrico'
}

function rutaDesdeTipo(tipo: TipoCotizacionDashboard, id: string) {
  if (tipo === 'solar') return `/cotizaciones/${id}`
  if (tipo === 'bombeo') return `/bombeo/${id}`
  return `/electrico/${id}`
}

function convertirFilaReciente(
  tabla: TablaCotizacion,
  fila: CotizacionDashboardRow
): CotizacionRecienteDashboard {
  const tipo = tipoDesdeTabla(tabla)
  const clienteNombre = Array.isArray(fila.clientes)
    ? fila.clientes[0]?.nombre
    : undefined

  return {
    tipo,
    tipo_label: TIPOS_LABEL[tipo],
    cotizacion_id: fila.id,
    numero_cotizacion: fila.numero_cotizacion,
    cliente_nombre: clienteNombre ?? 'Cliente sin nombre',
    total_usd: normalizarMonto(fila.total_usd),
    estado: fila.estado,
    created_at: fila.created_at,
    ruta: rutaDesdeTipo(tipo, fila.id),
  }
}

async function obtenerCotizacionesTabla(
  tabla: TablaCotizacion,
  empresaId: string
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from(tabla)
    .select('id, numero_cotizacion, total_usd, estado, created_at, updated_at, clientes(nombre)')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data as CotizacionDashboardRow[]
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

function resolverUltimasCotizaciones(
  rpcData: CotizacionRecienteDashboard[] | null,
  filasUnificadas: CotizacionRecienteDashboard[]
) {
  if (rpcData) {
    return rpcData
  }

  return filasUnificadas
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
}

async function obtenerStockBajo(empresaId: string) {
  const supabase = createClient()

  const { data: dataView, error: errorView } = await supabase
    .from('inventario_stock_bajo')
    .select('id')
    .eq('empresa_id', empresaId)

  if (!errorView && dataView) {
    return dataView.length
  }

  const { data: dataNuevo, error: errorNuevo } = await supabase
    .from('inventario')
    .select('id, stock_actual, stock_minimo, activo')
    .eq('empresa_id', empresaId)

  if (!errorNuevo && dataNuevo) {
    return dataNuevo.filter((producto) => {
      const stockActual = Number(producto.stock_actual ?? 0)
      const stockMinimo = Number(producto.stock_minimo ?? 0)
      const activo = producto.activo === undefined ? true : Boolean(producto.activo)
      return activo && stockActual <= stockMinimo
    }).length
  }

  const { data: dataLegacy } = await supabase
    .from('inventario')
    .select('id, stock')
    .eq('empresa_id', empresaId)

  return (dataLegacy ?? []).filter((producto) => Number(producto.stock ?? 0) <= 0).length
}

function agregarMetricasCotizaciones(
  filas: CotizacionDashboardRow[],
  inicioMes: string,
  metricas: MetricasDashboard
) {
  for (const fila of filas) {
    const totalUsd = normalizarMonto(fila.total_usd)
    const creadaEnMes = new Date(fila.created_at).getTime() >= new Date(inicioMes).getTime()
    const actualizadaEnMes = new Date(fila.updated_at).getTime() >= new Date(inicioMes).getTime()

    if (creadaEnMes) {
      metricas.cotizacionesEsteMes += 1
      if (fila.estado === 'aprobada') {
        metricas.aprobadasEsteMes += 1
      }
    }

    if (actualizadaEnMes && ESTADOS_CERRADOS.has(fila.estado)) {
      metricas.valorCerradoMesUsd += totalUsd
    }

    if (ESTADOS_PIPELINE.has(fila.estado)) {
      metricas.valorPipelineUsd += totalUsd
    }

    if (fila.estado === 'en_instalacion') {
      metricas.proyectosEnInstalacion += 1
    }
  }
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
    cotizacionesSolar,
    cotizacionesBombeo,
    cotizacionesElectrico,
    stockBajo,
    ultimasCotizacionesRpc,
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
    obtenerCotizacionesTabla('cotizaciones', empresaId),
    obtenerCotizacionesTabla('cotizaciones_bombeo', empresaId),
    obtenerCotizacionesTabla('cotizaciones_electrico', empresaId),
    obtenerStockBajo(empresaId),
    obtenerUltimasCotizacionesRpc(empresaId),
  ])

  const usuarioActual: UsuarioDashboard = {
    id: usuario?.id ?? user.id,
    nombre: usuario?.nombre ?? user.email?.split('@')[0] ?? 'Equipo',
    email: usuario?.email ?? user.email ?? '',
    rol: (usuario?.rol ?? 'vendedor') as RolDashboard,
  }

  const metricas: MetricasDashboard = {
    cotizacionesEsteMes: 0,
    clientesNuevos: clientesNuevos ?? 0,
    aprobadasEsteMes: 0,
    tasaConversion: 0,
    valorPipelineUsd: 0,
    valorCerradoMesUsd: 0,
    proyectosEnInstalacion: 0,
    stockBajo,
  }

  agregarMetricasCotizaciones(cotizacionesSolar, inicioMes, metricas)
  agregarMetricasCotizaciones(cotizacionesBombeo, inicioMes, metricas)
  agregarMetricasCotizaciones(cotizacionesElectrico, inicioMes, metricas)

  metricas.tasaConversion =
    metricas.cotizacionesEsteMes === 0
      ? 0
      : Number(
          (
            (metricas.aprobadasEsteMes / metricas.cotizacionesEsteMes) *
            100
          ).toFixed(1)
        )

  const unificadas = [
    ...cotizacionesSolar.map((fila) => convertirFilaReciente('cotizaciones', fila)),
    ...cotizacionesBombeo.map((fila) => convertirFilaReciente('cotizaciones_bombeo', fila)),
    ...cotizacionesElectrico.map((fila) => convertirFilaReciente('cotizaciones_electrico', fila)),
  ]

  let ultimasCotizaciones = resolverUltimasCotizaciones(
    ultimasCotizacionesRpc,
    unificadas
  )

  if (usuarioActual.rol === 'tecnico') {
    ultimasCotizaciones = ultimasCotizaciones
      .filter((cotizacion) => cotizacion.estado === 'en_instalacion')
      .slice(0, 5)
  }

  return {
    usuario: usuarioActual,
    saludo: obtenerSaludo(),
    fechaLarga: obtenerFechaLarga(),
    metricas,
    ultimasCotizaciones,
  }
}
