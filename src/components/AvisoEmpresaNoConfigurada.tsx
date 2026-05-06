import Link from 'next/link'
import { Building2, ChevronLeft } from 'lucide-react'

export function AvisoEmpresaNoConfigurada({
  titulo = 'Empresa no configurada',
  volverA = '/configuracion',
}: {
  titulo?: string
  volverA?: string
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={volverA}
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
            {titulo}
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-0.5">
            SolarOS necesita saber a que empresa pertenece este usuario.
          </p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-[var(--accent-bg)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <p className="text-[14px] font-medium text-[var(--text)]">
              Tu usuario aun no esta conectado a una empresa.
            </p>
            <p className="text-[13px] text-[var(--text-2)]">
              Completa la configuracion inicial y SolarOS creara la empresa, te asignara como admin y habilitara esta seccion.
            </p>
            <Link
              href="/configuracion"
              className="inline-flex items-center h-9 px-4 rounded-[var(--radius-sm)] bg-[var(--text)] text-[var(--bg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              Ir a configuracion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
