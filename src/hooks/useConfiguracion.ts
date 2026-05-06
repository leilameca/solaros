'use client'

import { useEffect, useState } from 'react'
import type {
  ConfiguracionEmpresaData,
  FeedbackConfiguracion,
  TabConfiguracion,
} from '@/types/configuracion'

const ESTADO_DIRTY_INICIAL: Record<TabConfiguracion, boolean> = {
  empresa: false,
  apariencia: false,
  operativo: false,
  usuarios: false,
  suscripcion: false,
  tutorial: false,
}

export function useConfiguracion(_initialData: ConfiguracionEmpresaData) {
  const [tabActivo, setTabActivo] = useState<TabConfiguracion>('empresa')
  const [dirtyTabs, setDirtyTabs] =
    useState<Record<TabConfiguracion, boolean>>(ESTADO_DIRTY_INICIAL)
  const [feedback, setFeedback] = useState<FeedbackConfiguracion | null>(null)

  useEffect(() => {
    if (!feedback) return

    const timeout = window.setTimeout(() => {
      setFeedback(null)
    }, 4200)

    return () => window.clearTimeout(timeout)
  }, [feedback])

  function cambiarTab(tab: TabConfiguracion) {
    if (tab === tabActivo) return

    if (dirtyTabs[tabActivo]) {
      const continuar = window.confirm(
        'Tienes cambios sin guardar en este tab. Si cambias ahora perderas esa edicion.'
      )

      if (!continuar) return
    }

    setTabActivo(tab)
  }

  function actualizarDirty(tab: TabConfiguracion, dirty: boolean) {
    setDirtyTabs((prev) => {
      if (prev[tab] === dirty) return prev
      return { ...prev, [tab]: dirty }
    })
  }

  return {
    tabActivo,
    cambiarTab,
    dirtyTabs,
    actualizarDirty,
    feedback,
    setFeedback,
  }
}
