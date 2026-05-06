'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { COLORES_ACENTO } from '@/lib/configuracion'
import { guardarAparienciaEmpresa } from '@/app/(dashboard)/configuracion/actions'
import { BloqueoConfiguracionInicial } from '@/components/configuracion/BloqueoConfiguracionInicial'
import { TabLogo } from '@/components/configuracion/TabLogo'
import type { EmpresaConfiguracion, FeedbackConfiguracion } from '@/types/configuracion'

export function TabApariencia({
  empresa,
  modoInicial,
  onDirtyChange,
  onFeedback,
}: {
  empresa: EmpresaConfiguracion
  modoInicial: boolean
  onDirtyChange: (dirty: boolean) => void
  onFeedback: (feedback: FeedbackConfiguracion | null) => void
}) {
  const [guardando, startTransition] = useTransition()
  const [colorBase, setColorBase] = useState(empresa.color_primario || '#C8860A')
  const [colorPrimario, setColorPrimario] = useState(empresa.color_primario || '#C8860A')
  const [logoUrlBase, setLogoUrlBase] = useState<string | null>(empresa.logo_url)
  const [logoSeleccionado, setLogoSeleccionado] = useState<File | null>(null)

  useEffect(() => {
    onDirtyChange(colorBase !== colorPrimario || logoSeleccionado !== null)
  }, [colorBase, colorPrimario, logoSeleccionado, onDirtyChange])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', colorPrimario)
  }, [colorPrimario])

  if (modoInicial) {
    return (
      <BloqueoConfiguracionInicial descripcion="Guarda primero Mi empresa para habilitar logo y apariencia de marca." />
    )
  }

  function handleGuardar() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('color_primario', colorPrimario)
      formData.set('logo_url_actual', logoUrlBase ?? '')

      if (logoSeleccionado) {
        formData.set('logo', logoSeleccionado)
      }

      const resultado = await guardarAparienciaEmpresa(formData)

      if (resultado.error) {
        onFeedback({ type: 'error', message: resultado.error })
        return
      }

      setColorBase(colorPrimario)
      setLogoUrlBase(
        typeof resultado.logo_url === 'string' || resultado.logo_url === null
          ? resultado.logo_url
          : logoUrlBase
      )
      setLogoSeleccionado(null)

      onFeedback({
        type: 'success',
        message: resultado.message ?? 'Apariencia actualizada.',
      })
    })
  }

  return (
    <div className="space-y-5">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
            Identidad visual
          </p>
          <p className="text-[13px] text-[var(--text-2)]">
            Ajusta logo y color de acento para que propuestas y cabeceras reflejen tu marca.
          </p>
        </div>

        <TabLogo
          logoUrlInicial={logoUrlBase}
          disabled={guardando}
          onFileChange={setLogoSeleccionado}
        />

        <div className="space-y-3">
          <div>
            <p className="text-[12px] font-medium text-[var(--text-2)]">Color de acento</p>
            <p className="text-[11px] text-[var(--text-3)] mt-1">
              Se aplica a botones, badges y elementos de marca.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {COLORES_ACENTO.map((color) => (
              <button
                key={color.valor}
                type="button"
                onClick={() => setColorPrimario(color.valor)}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className="h-9 w-9 rounded-full border-2"
                  style={{
                    backgroundColor: color.valor,
                    borderColor: colorPrimario === color.valor ? 'var(--text)' : 'rgba(0,0,0,0.08)',
                  }}
                />
                <span className="text-[11px] text-[var(--text-3)]">{color.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[12px] font-medium text-[var(--text-2)]">Color personalizado</label>
            <input
              type="color"
              value={colorPrimario}
              onChange={(event) => setColorPrimario(event.target.value)}
              className="h-10 w-14 rounded-[var(--radius-sm)] border border-[var(--border-s)] bg-transparent cursor-pointer"
            />
            <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--text)]">
              {colorPrimario.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
          <p className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
            Preview
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              className="px-4 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium text-white"
              style={{ backgroundColor: colorPrimario }}
            >
              Boton acento
            </button>
            <Badge
              className="border"
              style={{
                backgroundColor: `${colorPrimario}22`,
                color: colorPrimario,
                borderColor: `${colorPrimario}66`,
              }}
            >
              Badge preview
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="accent"
            onClick={handleGuardar}
            loading={guardando}
            disabled={guardando}
          >
            Guardar apariencia
          </Button>
        </div>
      </div>
    </div>
  )
}
