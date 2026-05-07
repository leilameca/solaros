import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { FormularioEditarCotizacion } from '@/components/cotizaciones/FormularioEditarCotizacion'
import { PRECIO_WP_DEFAULT, TASA_DOLAR_DEFAULT } from '@/lib/constants'
import type { Cotizacion } from '@/types/cotizaciones'

export default async function EditarCotizacionPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()
  if (!empresaId) redirect('/login')

  const [{ data, error }, { data: empresa }] = await Promise.all([
    supabase
      .from('cotizaciones')
      .select('*, clientes(nombre)')
      .eq('id', params.id)
      .eq('empresa_id', empresaId)
      .single(),
    supabase
      .from('empresas')
      .select('precio_wp, tasa_dolar')
      .eq('id', empresaId)
      .single(),
  ])

  if (error || !data) notFound()

  const cotizacion = data as unknown as Cotizacion & {
    clientes: { nombre: string } | null
  }

  const precioWp = empresa?.precio_wp ?? PRECIO_WP_DEFAULT
  const tasaDolar = empresa?.tasa_dolar ?? TASA_DOLAR_DEFAULT

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/cotizaciones/${params.id}`}
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Editar {cotizacion.numero_cotizacion}
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            {cotizacion.clientes?.nombre ?? 'Sin cliente'}
            {' · '}
            Precio Wp:{' '}
            <span className="font-[family-name:var(--font-mono)]">${precioWp}/Wp</span>
            {' · '}
            Tasa:{' '}
            <span className="font-[family-name:var(--font-mono)]">RD${tasaDolar}</span>
          </p>
        </div>
      </div>

      <FormularioEditarCotizacion cotizacion={cotizacion} />
    </div>
  )
}
