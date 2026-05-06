'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BloqueoConfiguracionInicial } from '@/components/configuracion/BloqueoConfiguracionInicial'
import { formatearUSDConfiguracion, TEXTO_TERMINOS_PDF_SUGERIDO } from '@/lib/configuracion'
import { guardarConfigOperativa } from '@/app/(dashboard)/configuracion/actions'
import type {
  EmpresaConfiguracion,
  FeedbackConfiguracion,
  GuardarOperativoInput,
} from '@/types/configuracion'

function normalizarOperativo(empresa: EmpresaConfiguracion): GuardarOperativoInput {
  return {
    precio_wp: Number(empresa.precio_wp || 0),
    tasa_dolar: Number(empresa.tasa_dolar || 0),
    terminos_pdf: empresa.terminos_pdf || '',
  }
}

export function TabOperativo({
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
  const [baseForm, setBaseForm] = useState<GuardarOperativoInput>(() => normalizarOperativo(empresa))
  const [form, setForm] = useState<GuardarOperativoInput>(() => normalizarOperativo(empresa))
  const [precioEjemplo, setPrecioEjemplo] = useState(Number(empresa.precio_wp || 0))

  useEffect(() => {
    onDirtyChange(JSON.stringify(baseForm) !== JSON.stringify(form))
  }, [baseForm, form, onDirtyChange])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPrecioEjemplo(Number(form.precio_wp || 0))
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [form.precio_wp])

  if (modoInicial) {
    return (
      <BloqueoConfiguracionInicial descripcion="Despues de crear la empresa podras definir precio por Wp, tasa del dolar y terminos PDF." />
    )
  }

  const ejemplo5Kwp = 5 * 1000 * precioEjemplo
  const ejemplo10Kwp = 10 * 1000 * precioEjemplo
  const ejemploUsdDesdePesos =
    Number(form.tasa_dolar || 0) > 0 ? 1000 / Number(form.tasa_dolar || 1) : 0

  function actualizar<K extends keyof GuardarOperativoInput>(
    campo: K,
    valor: GuardarOperativoInput[K]
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleGuardar() {
    startTransition(async () => {
      const resultado = await guardarConfigOperativa({
        ...form,
        terminos_pdf: form.terminos_pdf.slice(0, 800),
      })

      if (resultado.error) {
        onFeedback({ type: 'error', message: resultado.error })
        return
      }

      const siguienteBase = {
        ...form,
        terminos_pdf: form.terminos_pdf.slice(0, 800),
      }

      setBaseForm(siguienteBase)
      setForm(siguienteBase)
      onFeedback({
        type: 'success',
        message: resultado.message ?? 'Configuracion operativa actualizada.',
      })
    })
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
          Parametros operativos
        </p>
        <p className="text-[13px] text-[var(--text-2)]">
          Estos valores impactan calculos comerciales, conversiones y textos del PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Precio por Watt-pico (USD)"
          type="number"
          step="0.01"
          value={String(form.precio_wp)}
          onChange={(event) => actualizar('precio_wp', Number(event.target.value))}
          hint="Este valor se usa para calcular el costo total de sistemas solares."
        />
        <Input
          label="Tasa de cambio RD$/USD"
          type="number"
          step="0.01"
          value={String(form.tasa_dolar)}
          onChange={(event) => actualizar('tasa_dolar', Number(event.target.value))}
          hint="Se usa para convertir totales a pesos dominicanos."
        />
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
        <p className="text-[12px] font-medium text-[var(--text)]">
          Sistema de 5 KWp -&gt; {formatearUSDConfiguracion(ejemplo5Kwp)} USD
        </p>
        <p className="text-[12px] font-medium text-[var(--text)]">
          Sistema de 10 KWp -&gt; {formatearUSDConfiguracion(ejemplo10Kwp)} USD
        </p>
        <p className="text-[11px] text-[var(--text-3)]">
          RD$1,000 = {formatearUSDConfiguracion(ejemploUsdDesdePesos)} USD
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          label="Terminos que aparecen al pie de las propuestas PDF"
          rows={6}
          placeholder={TEXTO_TERMINOS_PDF_SUGERIDO}
          value={form.terminos_pdf}
          onChange={(event) => actualizar('terminos_pdf', event.target.value.slice(0, 800))}
        />
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <p className="text-[var(--text-3)]">Maximo 800 caracteres.</p>
          <p className="text-[var(--text-3)]">{form.terminos_pdf.length}/800</p>
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
          Guardar operativo
        </Button>
      </div>
    </div>
  )
}
