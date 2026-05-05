'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  Sun,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

function NavLink({
  href,
  label,
  icon: Icon,
  activo,
}: {
  href: string
  label: string
  icon: React.ElementType
  activo: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors',
        activo
          ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
          : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 w-[220px] h-screen bg-[var(--surface)] border-r border-[var(--border)] z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border)]">
        <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
          <Sun className="h-4 w-4 text-white" />
        </div>
        <span className="text-[14px] font-medium text-[var(--text)] tracking-[-0.02em]">
          SolarOS
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            activo={
              item.href === '/cotizaciones'
                ? pathname.startsWith('/cotizaciones')
                : pathname === item.href
            }
          />
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

// Navegación inferior para móvil
export function BottomNav() {
  const pathname = usePathname()

  const mobileItems = navItems.slice(0, 4)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--surface)] border-t border-[var(--border)] z-40 flex items-center">
      {mobileItems.map((item) => {
        const Icon = item.icon
        const activo =
          item.href === '/cotizaciones'
            ? pathname.startsWith('/cotizaciones')
            : pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors',
              activo ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
