import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CatalogoManager } from '@/components/electrico/CatalogoManager'
import type { CatalogoMaterial } from '@/types/electrico'

export default async function CatalogoElectricoPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('catalogo_materiales_electrico')
    .select('*')
    .order('descripcion')

  if (error) {
    return (
      <div className="text-[13px] text-[var(--red)]">
        Error al cargar catálogo: {error.message}
      </div>
    )
  }

  const catalogo = (data ?? []) as CatalogoMaterial[]

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/electrico"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Catálogo de materiales
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            {catalogo.filter((m) => m.activo).length} activos ·{' '}
            {catalogo.length} total
          </p>
        </div>
      </div>

      <CatalogoManager catalogoInicial={catalogo} />
    </div>
  )
}
