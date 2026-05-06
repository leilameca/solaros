import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { FormularioNuevoProducto } from '@/components/inventario/FormularioNuevoProducto'
import { AvisoEmpresaNoConfigurada } from '@/components/AvisoEmpresaNoConfigurada'

export default async function NuevoProductoInventarioPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const empresaId = await obtenerEmpresaId()

  if (!empresaId) {
    return <AvisoEmpresaNoConfigurada titulo="Inventario no disponible" volverA="/configuracion" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inventario"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Nuevo producto
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            Crea paneles, inversores, bombas, VFDs o materiales electricos con stock inicial.
          </p>
        </div>
      </div>

      <FormularioNuevoProducto />
    </div>
  )
}
