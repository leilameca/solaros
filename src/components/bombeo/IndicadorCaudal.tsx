import { cn } from '@/lib/utils'
import { formatearNumero } from '@/lib/calculos'

export function IndicadorCaudal({
  litrosDisponibles,
  litrosRequeridos,
}: {
  litrosDisponibles: number
  litrosRequeridos: number
}) {
  const cubre = litrosDisponibles >= litrosRequeridos
  const porcentaje = litrosRequeridos > 0
    ? Math.min((litrosDisponibles / litrosRequeridos) * 100, 100)
    : 0

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
        Cobertura de caudal
      </p>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-[var(--text-3)]">Disponibles</p>
          <p className="font-[family-name:var(--font-mono)] text-[15px] font-medium text-[var(--text)] mt-1">
            {formatearNumero(litrosDisponibles, 0)}
            <span className="text-[var(--text-3)] text-[10px] ml-1">L/dia</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[var(--text-3)]">Requeridos</p>
          <p className="font-[family-name:var(--font-mono)] text-[15px] font-medium text-[var(--text)] mt-1">
            {formatearNumero(litrosRequeridos, 0)}
            <span className="text-[var(--text-3)] text-[10px] ml-1">L/dia</span>
          </p>
        </div>
      </div>

      <div className="mt-4 h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            cubre ? 'bg-[var(--green)]' : 'bg-[var(--red)]'
          )}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={cn('text-[12px] font-medium', cubre ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
          {cubre ? 'El caudal cubre el requerimiento diario.' : 'El caudal no cubre el requerimiento diario.'}
        </p>
        <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-3)]">
          {porcentaje.toFixed(0)}%
        </p>
      </div>
    </div>
  )
}
