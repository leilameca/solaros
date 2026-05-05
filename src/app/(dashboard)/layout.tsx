import { Sidebar, BottomNav } from '@/components/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <BottomNav />
      <main className="md:pl-[220px] min-h-screen">
        <div className="mx-auto max-w-content px-5 md:px-8 py-6 pb-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
