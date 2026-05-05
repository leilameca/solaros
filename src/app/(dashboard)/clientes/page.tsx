import { createClient } from '@/lib/supabase/server'
import { ClientesView } from '@/components/clientes/ClientesView'
import type { ClienteCRM } from '@/types/clientes'

export default async function ClientesPage() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select('id, empresa_id, nombre, email, telefono, whatsapp, numero_contrato, provincia, notas, etapa_pipeline, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(300)

  if (error) {
    return (
      <div className="text-[13px] text-[var(--red)]">
        Error al cargar clientes: {error.message}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
          Clientes
        </h1>
        <p className="text-[13px] text-[var(--text-3)] mt-0.5">
          Lista operativa y pipeline comercial del equipo.
        </p>
      </div>

      <ClientesView clientesIniciales={(data ?? []) as ClienteCRM[]} />
    </div>
  )
}
