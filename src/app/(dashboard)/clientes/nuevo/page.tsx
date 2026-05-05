import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FormularioNuevoCliente } from '@/components/clientes/FormularioNuevoCliente'

export default function NuevoClientePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/clientes"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Nuevo cliente
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            Registro simple para iniciar seguimiento comercial.
          </p>
        </div>
      </div>

      <FormularioNuevoCliente />
    </div>
  )
}
