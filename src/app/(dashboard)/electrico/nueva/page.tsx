import Link from 'next/link'
import { ChevronLeft, Zap } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'

export default async function NuevaCotizacionElectricaPage({
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

  const { data: cliente } = clienteId
    ? await supabase
        .from('clientes')
        .select('id, nombre, telefono, email')
        .eq('id', clienteId)
        .single()
    : { data: null }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={cliente ? `/clientes/${cliente.id}` : '/clientes'}
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Nueva cotizacion electrica
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            Base preparada para conectar el modulo electrico al CRM.
          </p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--surface-2)] text-[var(--text)]">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-[var(--text)]">
              Modulo electrico pendiente
            </p>
            <p className="text-[13px] text-[var(--text-3)] mt-0.5">
              La navegacion desde clientes ya quedo lista y esta ruta evita enlaces rotos.
            </p>
          </div>
        </div>

        {cliente && (
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
              Cliente preseleccionado
            </p>
            <p className="text-[14px] font-medium text-[var(--text)]">{cliente.nombre}</p>
            <div className="mt-2 flex flex-col gap-1 text-[12px] text-[var(--text-3)]">
              {cliente.telefono && <span>{cliente.telefono}</span>}
              {cliente.email && <span>{cliente.email}</span>}
            </div>
          </div>
        )}

        <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
          Cuando construyamos el modulo de servicios electricos, esta pantalla puede reutilizar
          el mismo patron de prellenado por `cliente_id` que ya queda funcionando en solar y
          bombeo.
        </p>
      </div>
    </div>
  )
}
