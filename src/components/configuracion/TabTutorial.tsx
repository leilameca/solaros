import Link from 'next/link'
import { ArrowRight, Building2, Droplets, FileSpreadsheet, Package, Users } from 'lucide-react'

export function TabTutorial({
  modoInicial,
}: {
  modoInicial: boolean
}) {
  const pasos = [
    {
      titulo: 'Configura tu empresa',
      descripcion:
        'Completa datos legales, contacto, color y parametros operativos para activar el espacio.',
      href: '/configuracion',
      icon: Building2,
      estado: modoInicial ? 'Paso recomendado ahora' : 'Completalo y mantenlo actualizado',
    },
    {
      titulo: 'Crea tu primer cliente',
      descripcion:
        'El CRM es la base del resto del sistema. Desde ahi podras levantar cotizaciones y dar seguimiento.',
      href: '/clientes/nuevo',
      icon: Users,
      estado: 'Registra leads, contratos y seguimiento',
    },
    {
      titulo: 'Cotiza solar o bombeo',
      descripcion:
        'Genera una propuesta con calculos automaticos y deja trazabilidad comercial desde el inicio.',
      href: '/cotizaciones/nueva',
      icon: FileSpreadsheet,
      estado: 'Solar, bombeo y electrico comparten clientes',
    },
    {
      titulo: 'Revisa inventario',
      descripcion:
        'Confirma disponibilidad de equipos antes de comprometer fechas, materiales o modelos al cliente.',
      href: '/inventario',
      icon: Package,
      estado: 'Especialmente importante si trabajas con paneles, bombas y VFD',
    },
    {
      titulo: 'Sigue proyectos y bombeo',
      descripcion:
        'Usa los detalles de cotizacion y el dashboard para mover proyectos desde aprobada hasta completada.',
      href: '/bombeo',
      icon: Droplets,
      estado: 'Monitorea conversion, pipeline y ejecucion',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
          Guia rapida
        </p>
        <h2 className="text-[20px] font-medium text-[var(--text)] tracking-[-0.02em]">
          Aprende SolarOS en menos de 10 minutos
        </h2>
        <p className="text-[13px] text-[var(--text-2)] mt-2 max-w-[720px]">
          Esta seccion funciona como tutorial operativo para nuevos admins y vendedores. Sigue el orden sugerido y tendras el sistema listo para cotizar, vender y dar seguimiento desde celular o desktop.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pasos.map((paso, index) => {
          const Icon = paso.icon

          return (
            <div
              key={paso.titulo}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-[var(--accent-bg)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2 min-w-0">
                  <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
                    Paso {index + 1}
                  </p>
                  <h3 className="text-[16px] font-medium text-[var(--text)]">{paso.titulo}</h3>
                  <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
                    {paso.descripcion}
                  </p>
                  <p className="text-[12px] text-[var(--text-3)]">{paso.estado}</p>
                  <Link
                    href={paso.href}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:opacity-90 transition-opacity"
                  >
                    Abrir seccion
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
          Consejo operativo
        </p>
        <p className="text-[13px] text-[var(--text-2)]">
          Si estas empezando, primero termina <span className="font-medium text-[var(--text)]">Mi empresa</span>, luego crea un cliente y despues genera tu primera cotizacion. Eso evita errores de permisos y deja todo enlazado desde el principio.
        </p>
      </div>
    </div>
  )
}
