import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { WizardNuevoPlan } from '@/components/cobros/WizardNuevoPlan'
import { TASA_DOLAR_DEFAULT } from '@/lib/constants'
import { createClient, obtenerConfigEmpresa, obtenerEmpresaId } from '@/lib/supabase/server'

interface SearchParams {
  cotizacion_id?: string
  tipo?: string
}

type TipoCotizacionCobro = 'solar' | 'bombeo' | 'electrico'

interface ClienteRelacionado {
  id: string
  nombre: string
}

interface CotizacionRelacionada {
  id: string
  numero_cotizacion: string
  total_usd: number
  estado: string
  clientes: ClienteRelacionado[] | ClienteRelacionado | null
}

export default async function NuevoPlanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const cotizacionId = searchParams.cotizacion_id
  const tipo = searchParams.tipo as TipoCotizacionCobro | undefined

  if (!cotizacionId || !tipo || !['solar', 'bombeo', 'electrico'].includes(tipo)) {
    notFound()
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const empresaId = await obtenerEmpresaId()

  if (!empresaId) {
    redirect('/configuracion')
  }

  const { data: planExistente } = await supabase
    .from('planes_pago')
    .select('id')
    .eq('cotizacion_id', cotizacionId)
    .maybeSingle()

  if (planExistente) {
    redirect(`/cobros/${planExistente.id}`)
  }

  const tabla =
    tipo === 'solar'
      ? 'cotizaciones'
      : tipo === 'bombeo'
        ? 'cotizaciones_bombeo'
        : 'cotizaciones_electricas'

  const { data: cotizacion } = await supabase
    .from(tabla)
    .select('id, numero_cotizacion, total_usd, estado, clientes(id, nombre)')
    .eq('id', cotizacionId)
    .maybeSingle()

  if (!cotizacion) {
    notFound()
  }

  const cot = cotizacion as CotizacionRelacionada
  const cliente = Array.isArray(cot.clientes) ? (cot.clientes[0] ?? null) : cot.clientes

  const empresaConfig = await obtenerConfigEmpresa()
  const tasaDolar = empresaConfig?.tasa_dolar ?? TASA_DOLAR_DEFAULT

  const hrefVolver =
    tipo === 'solar'
      ? `/cotizaciones/${cotizacionId}`
      : tipo === 'bombeo'
        ? `/bombeo/${cotizacionId}`
        : `/electrico/${cotizacionId}`

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={hrefVolver}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium tracking-[-0.02em] text-[var(--text)]">
            Nuevo plan de cobro
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-3)]">
            {cot.numero_cotizacion} · {cliente?.nombre ?? 'Sin cliente'}
          </p>
        </div>
      </div>

      <WizardNuevoPlan
        cotizacion={{
          id: cot.id,
          numero_cotizacion: cot.numero_cotizacion,
          total_usd: cot.total_usd,
          total_rd: cot.total_usd * tasaDolar,
          cliente_id: cliente?.id ?? null,
          cliente_nombre: cliente?.nombre ?? 'Sin cliente',
          tipo,
        }}
        tasaDolar={tasaDolar}
      />
    </div>
  )
}
