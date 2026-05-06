import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { WizardNuevaCotizacion } from '@/components/cotizaciones/WizardNuevaCotizacion'
import { PRECIO_WP_DEFAULT, TASA_DOLAR_DEFAULT } from '@/lib/constants'
import { obtenerProductosInventario } from '@/lib/inventario'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams?: {
    cliente_id?: string
  }
}) {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()

  if (!empresaId) redirect('/login')
  const clienteId = typeof searchParams?.cliente_id === 'string' ? searchParams.cliente_id : null

  // Configuración de la empresa
  const [{ data: empresa }, { data: clienteInicial }] = await Promise.all([
    supabase
      .from('empresas')
      .select('precio_wp, tasa_dolar, nombre_empresa, logo_url')
      .eq('id', empresaId)
      .single(),
    clienteId
      ? supabase
          .from('clientes')
          .select('id, nombre, numero_contrato, provincia')
          .eq('id', clienteId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const empresaConfig = {
    precio_wp: empresa?.precio_wp ?? PRECIO_WP_DEFAULT,
    tasa_dolar: empresa?.tasa_dolar ?? TASA_DOLAR_DEFAULT,
    nombre_empresa: empresa?.nombre_empresa ?? '',
    logo_url: empresa?.logo_url ?? null,
  }

  const inventario = await obtenerProductosInventario({
    empresaId,
    categorias: ['panel_solar', 'inversor'],
    soloActivos: true,
  })

  const paneles = inventario.filter((item) => item.categoria === 'panel_solar' && item.stock_actual > 0)
  const inversores = inventario.filter((item) => item.categoria === 'inversor' && item.stock_actual > 0)

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/cotizaciones"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Nueva cotización
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            Precio Wp: <span className="font-[family-name:var(--font-mono)]">${empresaConfig.precio_wp}/Wp</span>
            {' · '}
            Tasa: <span className="font-[family-name:var(--font-mono)]">RD${empresaConfig.tasa_dolar}</span>
          </p>
        </div>
      </div>

      <WizardNuevaCotizacion
        empresaConfig={empresaConfig}
        paneles={paneles}
        inversores={inversores}
        clienteInicial={clienteInicial}
      />
    </div>
  )
}
