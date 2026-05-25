import { Sidebar, BottomNav, DesktopHeader, MobileHeader } from '@/components/sidebar'
import { UsuarioProvider } from '@/components/usuario/UsuarioProvider'
import { BurbujaAsistente } from '@/components/asistente/BurbujaAsistente'
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
        <main className="pt-[52px] md:pt-0 md:pl-[210px] min-h-screen">
          <div className="mx-auto max-w-content px-5 md:px-8 py-6 pb-28 md:pb-8 space-y-6">
            <DesktopHeader />
            {children}
          </div>
        </main>
        <BurbujaAsistente />
      </div>
    </UsuarioProvider>
  )
}
