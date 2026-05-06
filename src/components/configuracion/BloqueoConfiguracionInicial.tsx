import { Building2 } from 'lucide-react'

export function BloqueoConfiguracionInicial({
  titulo = 'Completa primero Mi empresa',
  descripcion = 'Esta seccion se habilita en cuanto guardes los datos iniciales de la empresa.',
}: {
  titulo?: string
  descripcion?: string
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-[var(--accent-bg)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-[14px] font-medium text-[var(--text)]">{titulo}</p>
          <p className="text-[13px] text-[var(--text-2)]">{descripcion}</p>
        </div>
      </div>
    </div>
  )
}
