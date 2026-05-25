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
        'flex items-center gap-2.5 px-4 py-[7px] text-[13px] font-medium transition-colors border-l-[2px]',
        activo
          ? 'border-[var(--accent)] text-[var(--text)]'
          : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-2)] hover:border-[var(--border-s)]'
      )}
    >
      <Icon className={cn('h-[15px] w-[15px] flex-shrink-0', activo && 'text-[var(--accent)]')} />
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
    <aside className="hidden md:flex flex-col fixed left-0 top-0 w-[210px] h-screen bg-[var(--surface)] border-r border-[var(--border)] z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <span className="text-[15px] font-[700] tracking-[-0.04em] text-[var(--text)]">
          Solar<span className="text-[var(--accent)]">OS</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 flex flex-col overflow-y-auto">
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

      {/* Logout */}
      <div className="border-t border-[var(--border)]">
        <button
          onClick={() => cerrarSesionApp(router)}
          className="flex items-center gap-2.5 w-full px-4 py-[10px] text-[13px] font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors border-l-[2px] border-transparent"
        >
          <LogOut className="h-[15px] w-[15px] flex-shrink-0" />
          Cerrar sesión
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
    <header className="md:hidden fixed top-0 left-0 right-0 h-[52px] bg-[var(--surface)] border-b border-[var(--border)] z-40">
      <div className="h-full px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[14px] font-[700] tracking-[-0.04em] text-[var(--text)] flex-shrink-0">
            Solar<span className="text-[var(--accent)]">OS</span>
          </span>
          <span className="text-[var(--border-s)] select-none text-[13px]">/</span>
          <p className="text-[13px] font-medium text-[var(--text-2)] truncate">{titulo}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {puedeVerConfiguracion ? (
            <Link
              href="/configuracion"
              className="flex items-center justify-center h-7 w-7 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
              aria-label="Configuración"
            >
              <Settings className="h-[15px] w-[15px]" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => cerrarSesionApp(router)}
            className="flex items-center justify-center h-7 w-7 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-[15px] w-[15px]" />
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
    <header className="hidden md:flex items-end justify-between gap-6 pb-5 border-b border-[var(--border)]">
      <h1 className="text-[26px] font-[700] tracking-[-0.04em] text-[var(--text)] leading-none">
        {titulo}
      </h1>
      <div className="flex items-center gap-5 pb-0.5">
        {puedeVerConfiguracion ? (
          <Link
            href="/configuracion"
            className="text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
          >
            <Settings className="h-[13px] w-[13px]" />
            Configuración
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => cerrarSesionApp(router)}
          className="text-[12px] font-medium text-[var(--text-3)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
        >
          <LogOut className="h-[13px] w-[13px]" />
          Salir
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
      className="md:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-[var(--surface)] border-t border-[var(--border)] z-40"
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
              'min-w-0 flex flex-col items-center justify-center gap-[3px] px-1 transition-colors',
              activo ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'
            )}
          >
            <Icon className="h-[15px] w-[15px]" />
            <span className="text-[9px] font-[600] leading-none tracking-[0.02em] truncate max-w-full uppercase">
              {item.mobileLabel}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
