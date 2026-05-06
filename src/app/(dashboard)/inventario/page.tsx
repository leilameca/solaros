import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { obtenerProductosInventario } from '@/lib/inventario'
import { InventarioListaClient } from '@/components/inventario/InventarioListaClient'
import { AvisoEmpresaNoConfigurada } from '@/components/AvisoEmpresaNoConfigurada'

export default async function InventarioPage({
  searchParams,
}: {
  searchParams?: {
    filtro?: string
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

  const productos = await obtenerProductosInventario({
    empresaId,
    soloActivos: true,
  })

  return (
    <InventarioListaClient
      productosIniciales={productos}
      filtroInicialStockBajo={searchParams?.filtro === 'stock_bajo'}
    />
  )
}
