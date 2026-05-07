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
  CreditCard,
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
  if (pathname.startsWith('/electrico')) return 'Eléctrico'
  if (pathname.startsWith('/clientes')) return 'Clientes'
  if (pathname.startsWith('/cobros')) return 'Cobros'
  if (pathname.startsWith('/inventario')) return 'Inventario'
  if (pathname.startsWith('/configuracion')) return 'Configuración'
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
    { href: '/electrico', label: 'Eléctrico', mobileLabel: 'Eléctrico', icon: Zap },
    { href: '/clientes', label: 'Clientes', mobileLabel: 'CRM', icon: Users },
    { href: '/cobros', label: 'Cobros', mobileLabel: 'Cobros', icon: CreditCard },
    ...(tieneInventario
      ? [{ href: '/inventario', label: 'Inventario', mobileLabel: 'Stock', icon: Package }]
      : []),
    ...((esSuperadmin || esAdminEmpresa)
      ? [{ href: '/configuracion', label: 'Configuración', mobileLabel: 'Ajustes', icon: Settings }]
      : []),
    ...(esSuperadmin
      ? [{ href: '/admin', label: 'Super admin', mobileLabel: 'Admin', icon: Shield }]
      : []),
  ] as const
}

async function cerrarSesionApp(router: ReturnType<typeof useRouter>) {
  const supabase = createClient()
  await supabase.auth.signOut()
  router.push('/login')
  router.refresh()
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
          onClick={() => cerrarSesionApp(router)}
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
            onClick={() => cerrarSesionApp(router)}
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

export function DesktopHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario } = useUsuario()
  const puedeVerConfiguracion = Boolean(usuario?.esSuperadmin || usuario?.rol === 'admin')
  const titulo = resolverTituloMovil(pathname)

  return (
    <header className="hidden md:flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Espacio de trabajo
        </p>
        <p className="text-[18px] font-medium tracking-[-0.02em] text-[var(--text)] truncate">
          {titulo}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {puedeVerConfiguracion ? (
          <Link href="/configuracion">
            <button className="bg-transparent text-[var(--text)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--surface-2)] transition-colors inline-flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuracion
            </button>
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => cerrarSesionApp(router)}
          className="bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium tracking-[-0.01em] hover:opacity-90 transition-opacity inline-flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
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
