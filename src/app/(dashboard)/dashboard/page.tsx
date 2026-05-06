import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import { formatearUSD } from '@/lib/calculos'
import { obtenerMetricasDashboard } from '@/lib/dashboard'
import { AvisoEmpresaNoConfigurada } from '@/components/AvisoEmpresaNoConfigurada'
import { MetricaCard } from '@/components/dashboard/MetricaCard'
import { ListaUltimasCotizaciones } from '@/components/dashboard/ListaUltimasCotizaciones'
import { DashboardAutoRefresh } from '@/components/dashboard/DashboardAutoRefresh'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { SaludoHeader } from '@/components/dashboard/SaludoHeader'

function formatearPorcentaje(valor: number) {
  return `${new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: valor % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valor)}%`
}

export default function DashboardRoutePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContenido />
    </Suspense>
  )
}

async function DashboardContenido() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const empresaId = await obtenerEmpresaId()

  if (!empresaId) {
    return <AvisoEmpresaNoConfigurada titulo="Dashboard no disponible" volverA="/configuracion" />
  }

  const data = await obtenerMetricasDashboard()

  if (!data) {
    return <AvisoEmpresaNoConfigurada titulo="Dashboard no disponible" volverA="/configuracion" />
  }

  const esTecnico = data.usuario.rol === 'tecnico'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <SaludoHeader nombre={data.usuario.nombre} />
        <DashboardAutoRefresh />
      </div>

      {esTecnico ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricaCard
            label="Proyectos en instalación"
            valor={data.metricas.proyectosEnInstalacion.toString()}
            descripcion="Cotizaciones activas en ejecución"
            acento="amber"
          />
          <MetricaCard
            label="Stock bajo"
            valor={data.metricas.stockBajo.toString()}
            descripcion="Productos que requieren seguimiento"
            acento={data.metricas.stockBajo > 0 ? 'red' : 'default'}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricaCard
              label="Cotizaciones este mes"
              valor={data.metricas.cotizacionesEsteMes.toString()}
              descripcion="Total creadas en el mes actual"
              acento="blue"
            />
            <MetricaCard
              label="Clientes nuevos"
              valor={data.metricas.clientesNuevos.toString()}
              descripcion="Altas recientes en el CRM"
              acento="default"
            />
            <MetricaCard
              label="Aprobadas"
              valor={data.metricas.aprobadasEsteMes.toString()}
              descripcion="Cotizaciones aprobadas en el mes"
              acento="green"
            />
            <MetricaCard
              label="Tasa conversión"
              valor={formatearPorcentaje(data.metricas.tasaConversion)}
              descripcion="Aprobadas sobre cotizaciones del mes"
              acento={data.metricas.tasaConversion >= 50 ? 'green' : data.metricas.tasaConversion > 0 ? 'amber' : 'default'}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <MetricaCard
              label="Valor pipeline USD"
              valor={formatearUSD(data.metricas.valorPipelineUsd)}
              descripcion="Cotizaciones en borrador o enviadas"
              acento="amber"
            />
            <MetricaCard
              label="Valor cerrado este mes USD"
              valor={formatearUSD(data.metricas.valorCerradoMesUsd)}
              descripcion="Aprobadas, en instalación o completadas"
              acento="green"
            />
          </div>
        </>
      )}

      {data.metricas.stockBajo > 0 ? (
        <Link
          href="/inventario?filtro=stock_bajo"
          className="block bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius)] p-4 hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[var(--red)]">
                {data.metricas.stockBajo} productos con stock bajo
              </p>
              <p className="text-[12px] text-[var(--red)] mt-1">
                Revisa inventario antes de comprometer nuevas cotizaciones.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--red)]">
              Ver inventario
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      ) : null}

      <ListaUltimasCotizaciones
        titulo={esTecnico ? 'Proyectos en instalación' : 'Últimas cotizaciones'}
        descripcion={
          esTecnico
            ? 'Solo se muestran proyectos listos para seguimiento técnico.'
            : 'Las cinco cotizaciones más recientes de cualquier módulo.'
        }
        cotizaciones={data.ultimasCotizaciones}
        mostrarMonto={!esTecnico}
      />
    </div>
  )
}
