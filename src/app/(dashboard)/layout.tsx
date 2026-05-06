import { Sidebar, BottomNav, MobileHeader } from '@/components/sidebar'
import { UsuarioProvider } from '@/components/usuario/UsuarioProvider'
import { obtenerContextoUsuarioApp } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const contextoUsuario = await obtenerContextoUsuarioApp()

  return (
    <UsuarioProvider value={contextoUsuario}>
      <div className="min-h-screen bg-[var(--bg)]">
        <Sidebar />
        <MobileHeader />
        <BottomNav />
        <main className="pt-[54px] md:pt-0 md:pl-[220px] min-h-screen">
          <div className="mx-auto max-w-content px-5 md:px-8 py-6 pb-20 md:pb-8">
            {children}
          </div>
        </main>
      </div>
    </UsuarioProvider>
  )
}
