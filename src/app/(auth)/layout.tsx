import { Sun } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
          <Sun className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-[16px] font-medium text-[var(--text)] tracking-[-0.02em]">
          SolarOS
        </span>
      </div>
      {children}
    </div>
  )
}
