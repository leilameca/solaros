export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-[var(--surface-2)] rounded-[var(--radius)] h-8 w-64 animate-pulse" />
        <div className="bg-[var(--surface-2)] rounded-[var(--radius)] h-4 w-52 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`top-${index}`}
            className="bg-[var(--surface-2)] rounded-[var(--radius)] h-[88px] animate-pulse"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={`middle-${index}`}
            className="bg-[var(--surface-2)] rounded-[var(--radius)] h-[88px] animate-pulse"
          />
        ))}
      </div>

      <div className="bg-[var(--surface-2)] rounded-[var(--radius)] h-[220px] animate-pulse" />
    </div>
  )
}
