function Pulse({ className }: { className: string }) {
  return <div className={`bg-[var(--surface-2)] rounded animate-pulse ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="space-y-2">
          <Pulse className="h-7 w-56" />
          <Pulse className="h-4 w-44" />
        </div>
        <Pulse className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 space-y-3">
            <Pulse className="h-3 w-28" />
            <Pulse className="h-7 w-20" />
            <Pulse className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 space-y-3">
            <Pulse className="h-3 w-28" />
            <Pulse className="h-7 w-32" />
            <Pulse className="h-3 w-44" />
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
        <div className="px-4 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <Pulse className="h-4 w-40" />
        </div>
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <Pulse className="h-5 w-16 flex-shrink-0" />
              <Pulse className="h-4 w-28 flex-shrink-0" />
              <Pulse className="h-4 flex-1" />
              <Pulse className="h-5 w-20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
