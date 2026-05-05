import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { WizardNuevaCotizacionBombeo } from '@/components/bombeo/WizardNuevaCotizacionBombeo'

export default async function NuevaCotizacionBombeoPage({
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

  const [{ data: empresa }, { data: clientes }, { data: inventario }, { data: clienteInicial }] = await Promise.all([
    supabase
      .from('empresas')
      .select('nombre_empresa, tasa_dolar, logo_url, email, telefono')
      .eq('id', empresaId)
      .single(),
    supabase
      .from('clientes')
      .select('id, nombre, email, telefono, numero_contrato, provincia')
      .order('nombre')
      .limit(100),
    supabase
      .from('inventario')
      .select('id, tipo, marca, modelo, potencia_w, potencia_kw, precio_unitario, stock, notas')
      .in('tipo', ['panel', 'inversor', 'otro'])
      .gt('stock', 0)
      .order('marca'),
    clienteId
      ? supabase
          .from('clientes')
          .select('id, nombre, email, telefono, numero_contrato, provincia')
          .eq('id', clienteId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const paneles = (inventario ?? []).filter((item) => item.tipo === 'panel')
  const vfds = (inventario ?? []).filter((item) => item.tipo === 'inversor')
  const bombas = (inventario ?? []).filter((item) => item.tipo === 'otro')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/bombeo"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Nueva cotizacion de bombeo
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            Empresa: <span className="font-medium text-[var(--text)]">{empresa?.nombre_empresa ?? 'SolarOS'}</span>
            {' - '}
            Tasa: <span className="font-[family-name:var(--font-mono)]">RD${empresa?.tasa_dolar ?? 54}</span>
          </p>
        </div>
      </div>

      <WizardNuevaCotizacionBombeo
        empresaConfig={{
          nombre_empresa: empresa?.nombre_empresa ?? 'SolarOS',
          tasa_dolar: Number(empresa?.tasa_dolar ?? 54),
          logo_url: empresa?.logo_url ?? null,
          email: empresa?.email ?? null,
          telefono: empresa?.telefono ?? null,
        }}
        clientes={clientes ?? []}
        bombas={bombas}
        paneles={paneles}
        vfds={vfds}
        clienteInicial={clienteInicial}
      />
    </div>
  )
}
