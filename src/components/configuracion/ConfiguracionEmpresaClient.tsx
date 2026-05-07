'use client'

import { cn } from '@/lib/utils'
import { TABS_CONFIGURACION } from '@/lib/configuracion'
import { useConfiguracion } from '@/hooks/useConfiguracion'
import { TabApariencia } from '@/components/configuracion/TabApariencia'
import { TabMiEmpresa } from '@/components/configuracion/TabMiEmpresa'
import { TabOperativo } from '@/components/configuracion/TabOperativo'
import { TabSuscripcion } from '@/components/configuracion/TabSuscripcion'
import { TabTutorial } from '@/components/configuracion/TabTutorial'
import { TabUsuarios } from '@/components/configuracion/TabUsuarios'
import type { ConfiguracionEmpresaData, TabConfiguracion } from '@/types/configuracion'

export function ConfiguracionEmpresaClient({
  initialData,
}: {
  initialData: ConfiguracionEmpresaData
}) {
  const { tabActivo, cambiarTab, dirtyTabs, actualizarDirty, feedback, setFeedback } =
    useConfiguracion(initialData)

  return (
    <div className="space-y-6">
      {initialData.modoInicial ? (
        <div className="bg-[var(--accent-bg)] border border-[var(--accent-bd)] rounded-[var(--radius)] p-4">
          <p className="text-[13px] font-medium text-[var(--accent)]">
            Configuracion inicial
          </p>
          <p className="text-[12px] text-[var(--text-2)] mt-1">
            Completa los datos de tu empresa para activar dashboard, inventario y el resto del espacio.
          </p>
        </div>
      ) : null}

      <select
        className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] font-[family-name:var(--font-sans)] sm:hidden"
        value={tabActivo}
        onChange={(event) => cambiarTab(event.target.value as TabConfiguracion)}
      >
        {TABS_CONFIGURACION.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {dirtyTabs[tab.id] ? `${tab.label} •` : tab.label}
          </option>
        ))}
      </select>

      <div className="hidden sm:flex flex-wrap gap-2">
        {TABS_CONFIGURACION.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => cambiarTab(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors',
              tabActivo === tab.id
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'bg-[var(--surface)] border border-[var(--border-s)] text-[var(--text-2)] hover:bg-[var(--surface-2)]'
            )}
          >
            <span>{tab.label}</span>
            {dirtyTabs[tab.id] ? <span className="text-[var(--accent)]">•</span> : null}
          </button>
        ))}
      </div>

      {feedback ? (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 max-w-[320px] rounded-[var(--radius)] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border',
            feedback.type === 'success'
              ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green)]'
              : 'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red)]'
          )}
        >
          <p className="text-[13px] font-medium">{feedback.message}</p>
        </div>
      ) : null}

      <div className={tabActivo === 'empresa' ? 'block' : 'hidden'}>
        <TabMiEmpresa
          empresa={initialData.empresa}
          modoInicial={initialData.modoInicial}
          onDirtyChange={(dirty) => actualizarDirty('empresa', dirty)}
          onFeedback={setFeedback}
        />
      </div>

      <div className={tabActivo === 'apariencia' ? 'block' : 'hidden'}>
        <TabApariencia
          empresa={initialData.empresa}
          modoInicial={initialData.modoInicial}
          onDirtyChange={(dirty) => actualizarDirty('apariencia', dirty)}
          onFeedback={setFeedback}
        />
      </div>

      <div className={tabActivo === 'operativo' ? 'block' : 'hidden'}>
        <TabOperativo
          empresa={initialData.empresa}
          modoInicial={initialData.modoInicial}
          onDirtyChange={(dirty) => actualizarDirty('operativo', dirty)}
          onFeedback={setFeedback}
        />
      </div>

      <div className={tabActivo === 'usuarios' ? 'block' : 'hidden'}>
        <TabUsuarios
          empresa={initialData.empresa}
          usuarioActual={initialData.usuarioActual}
          usuariosIniciales={initialData.usuarios}
          modoInicial={initialData.modoInicial}
          usuariosActivos={initialData.usuariosActivos}
          limiteUsuarios={initialData.limiteUsuarios}
          onDirtyChange={(dirty) => actualizarDirty('usuarios', dirty)}
          onFeedback={setFeedback}
        />
      </div>

      <div className={tabActivo === 'suscripcion' ? 'block' : 'hidden'}>
        <TabSuscripcion empresa={initialData.empresa} onFeedback={setFeedback} />
      </div>

      <div className={tabActivo === 'tutorial' ? 'block' : 'hidden'}>
        <TabTutorial modoInicial={initialData.modoInicial} />
      </div>
    </div>
  )
}
