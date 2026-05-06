interface MetricaCardProps {
  label: string
  valor: string
  descripcion?: string
}

export function MetricaCard({
  label,
  valor,
  descripcion,
}: MetricaCardProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)] mb-2">
        {label}
      </p>
      <p className="text-[28px] font-[300] text-[var(--text)] tracking-[-0.03em] font-[family-name:var(--font-sans)]">
        {valor}
      </p>
      {descripcion ? (
        <p className="text-[11px] text-[var(--text-3)] mt-1">{descripcion}</p>
      ) : null}
    </div>
  )
}
