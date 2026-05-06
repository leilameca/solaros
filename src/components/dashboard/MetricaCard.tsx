import { cn } from '@/lib/utils'

interface MetricaCardProps {
  label: string
  valor: string
  descripcion?: string
  acento?: 'default' | 'green' | 'blue' | 'amber' | 'red'
}

const ACENTO_CLASSES: Record<NonNullable<MetricaCardProps['acento']>, string> = {
  default: 'bg-[var(--border)]',
  green: 'bg-[var(--green)]',
  blue: 'bg-[#1B5FA8]',
  amber: 'bg-[var(--accent)]',
  red: 'bg-[var(--red)]',
}

export function MetricaCard({
  label,
  valor,
  descripcion,
  acento = 'default',
}: MetricaCardProps) {
  return (
    <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[var(--radius)]',
          ACENTO_CLASSES[acento]
        )}
      />
      <p className="text-[10px] font-medium text-[var(--text-3)] uppercase tracking-[0.08em] font-[family-name:var(--font-mono)] mb-2.5 pl-1">
        {label}
      </p>
      <p className="text-[26px] font-[300] text-[var(--text)] tracking-[-0.03em] font-[family-name:var(--font-sans)] leading-none pl-1">
        {valor}
      </p>
      {descripcion ? (
        <p className="text-[11px] text-[var(--text-3)] mt-1.5 pl-1">{descripcion}</p>
      ) : null}
    </div>
  )
}
