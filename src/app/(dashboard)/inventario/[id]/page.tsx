import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { obtenerMovimientosInventario, obtenerProductoInventario } from '@/lib/inventario'
import { AvisoEmpresaNoConfigurada } from '@/components/AvisoEmpresaNoConfigurada'
import { DetalleInventarioClient } from '@/components/inventario/DetalleInventarioClient'

export default async function DetalleInventarioPage({
  params,
  searchParams,
}: {
  params: {
    id: string
  }
  searchParams?: {
    page?: string
  }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()

  if (!empresaId) {
    return <AvisoEmpresaNoConfigurada titulo="Inventario no disponible" volverA="/configuracion" />
  }

  const paginaActual = Math.max(1, Number(searchParams?.page ?? '1') || 1)
  const limitePorPagina = 20

  const [producto, historial] = await Promise.all([
    obtenerProductoInventario(empresaId, params.id),
    obtenerMovimientosInventario(empresaId, params.id, paginaActual, limitePorPagina),
  ])

  if (!producto) {
    redirect('/inventario')
  }

  return (
    <DetalleInventarioClient
      productoInicial={producto}
      movimientosIniciales={historial.movimientos}
      totalMovimientos={historial.total}
      paginaActual={paginaActual}
      limitePorPagina={limitePorPagina}
    />
  )
}
