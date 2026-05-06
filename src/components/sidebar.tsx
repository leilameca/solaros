'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Droplets,
  Users,
  Package,
  Settings,
  Sun,
  LogOut,
  Zap,
  Shield,
} from 'lucide-react'
import { useUsuario } from '@/hooks/useUsuario'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

function esRutaActiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function resolverTituloMovil(pathname: string) {
  if (pathname.startsWith('/cotizaciones')) return 'Cotizaciones solar'
  if (pathname.startsWith('/bombeo')) return 'Bombeo'
  if (pathname.startsWith('/electrico')) return 'Electrico'
  if (pathname.startsWith('/clientes')) return 'Clientes'
  if (pathname.startsWith('/inventario')) return 'Inventario'
  if (pathname.startsWith('/configuracion')) return 'Configuracion'
  if (pathname.startsWith('/admin')) return 'Super admin'
  return 'Dashboard'
}

function resolverNavItems({
  esSuperadmin,
  esAdminEmpresa,
  tieneInventario,
}: {
  esSuperadmin: boolean
  esAdminEmpresa: boolean
  tieneInventario: boolean
}) {
  return [
    { href: '/dashboard', label: 'Dashboard', mobileLabel: 'Inicio', icon: LayoutDashboard },
    { href: '/cotizaciones', label: 'Cotizaciones solar', mobileLabel: 'Solar', icon: FileText },
    { href: '/bombeo', label: 'Bombeo', mobileLabel: 'Bombeo', icon: Droplets },
    { href: '/electrico', label: 'Electrico', mobileLabel: 'Electrico', icon: Zap },
    { href: '/clientes', label: 'Clientes', mobileLabel: 'CRM', icon: Users },
    ...(tieneInventario
      ? [{ href: '/inventario', label: 'Inventario', mobileLabel: 'Stock', icon: Package }]
      : []),
    ...((esSuperadmin || esAdminEmpresa)
      ? [{ href: '/configuracion', label: 'Configuracion', mobileLabel: 'Ajustes', icon: Settings }]
      : []),
    ...(esSuperadmin
      ? [{ href: '/admin', label: 'Super admin', mobileLabel: 'Admin', icon: Shield }]
      : []),
  ] as const
}

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
  const { usuario, empresa } = useUsuario()

  const navItems = resolverNavItems({
    esSuperadmin: Boolean(usuario?.esSuperadmin),
    esAdminEmpresa: usuario?.rol === 'admin',
    tieneInventario: Boolean(usuario?.esSuperadmin || empresa?.plan_actual !== 'basico'),
  })

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 w-[220px] h-screen bg-[var(--surface)] border-r border-[var(--border)] z-40">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border)]">
        <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
          <Sun className="h-4 w-4 text-white" />
        </div>
        <span className="text-[14px] font-medium text-[var(--text)] tracking-[-0.02em]">
          SolarOS
        </span>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            activo={esRutaActiva(pathname, item.href)}
          />
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}

export function MobileHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario } = useUsuario()
  const puedeVerConfiguracion = Boolean(usuario?.esSuperadmin || usuario?.rol === 'admin')
  const titulo = resolverTituloMovil(pathname)

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[54px] bg-[var(--surface)] border-b border-[var(--border)] z-40">
      <div className="h-full px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
            <Sun className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[var(--text)] truncate">SolarOS</p>
            <p className="text-[10px] text-[var(--text-3)] truncate">{titulo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {puedeVerConfiguracion ? (
            <Link
              href="/configuracion"
              className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)]"
              aria-label="Configuracion"
            >
              <Settings className="h-4 w-4" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)]"
            aria-label="Cerrar sesion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const { usuario, empresa } = useUsuario()

  const navItems = resolverNavItems({
    esSuperadmin: Boolean(usuario?.esSuperadmin),
    esAdminEmpresa: usuario?.rol === 'admin',
    tieneInventario: Boolean(usuario?.esSuperadmin || empresa?.plan_actual !== 'basico'),
  }).filter((item) => item.href !== '/admin')

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface)] border-t border-[var(--border)] z-40"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const activo = esRutaActiva(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors',
              activo ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[9px] font-medium leading-none truncate max-w-full">
              {item.mobileLabel}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
