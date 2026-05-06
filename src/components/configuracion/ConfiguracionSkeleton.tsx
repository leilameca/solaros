export function ConfiguracionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-52 rounded-[var(--radius)] bg-[var(--surface-2)] animate-pulse" />
        <div className="h-4 w-72 rounded-[var(--radius)] bg-[var(--surface-2)] animate-pulse" />
      </div>

      <div className="h-10 w-full sm:w-72 rounded-[var(--radius)] bg-[var(--surface-2)] animate-pulse" />

      <div className="hidden sm:flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-9 w-28 rounded-[var(--radius-sm)] bg-[var(--surface-2)] animate-pulse"
          />
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-[var(--radius)] bg-[var(--surface-2)] animate-pulse"
            />
          ))}
        </div>
        <div className="h-10 w-40 rounded-[var(--radius-sm)] bg-[var(--surface-2)] animate-pulse" />
      </div>
    </div>
  )
}
