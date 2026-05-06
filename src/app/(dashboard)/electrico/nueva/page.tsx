import { createClient, obtenerConfigEmpresa } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { WizardNuevoElectrico } from '@/components/electrico/WizardNuevoElectrico'
import { TASA_DOLAR_DEFAULT } from '@/lib/constants'

export default async function NuevaCotizacionElectricaPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const config = await obtenerConfigEmpresa()
  if (!config) redirect('/login')

  const tasaDolar = config.tasa_dolar ?? TASA_DOLAR_DEFAULT

  // Clientes de la empresa
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nombre')
    .order('nombre')

  // Catálogo de materiales activos
  const { data: catalogo } = await supabase
    .from('catalogo_materiales_electrico')
    .select('*')
    .eq('activo', true)
    .order('descripcion')

  // Cotizaciones solares para vinculación
  const { data: cotizacionesSolares } = await supabase
    .from('cotizaciones')
    .select('id, numero_cotizacion')
    .order('created_at', { ascending: false })
    .limit(50)

  // Cotizaciones bombeo para vinculación
  const { data: cotizacionesBombeo } = await supabase
    .from('cotizaciones_bombeo')
    .select('id, numero_cotizacion')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-7">
        <Link
          href="/electrico"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Nueva cotización eléctrica
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            Tasa activa: {tasaDolar} RD$/USD
          </p>
        </div>
      </div>

      <WizardNuevoElectrico
        clientes={(clientes ?? []) as { id: string; nombre: string }[]}
        catalogo={(catalogo ?? []) as never}
        cotizacionesSolares={
          (cotizacionesSolares ?? []) as { id: string; numero_cotizacion: string }[]
        }
        cotizacionesBombeo={
          (cotizacionesBombeo ?? []) as { id: string; numero_cotizacion: string }[]
        }
        tasaDolar={tasaDolar}
      />
    </div>
  )
}
