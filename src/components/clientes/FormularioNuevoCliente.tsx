'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { crearCliente } from '@/app/(dashboard)/clientes/actions'
import { ETAPAS_PIPELINE, ETIQUETAS_ETAPA_PIPELINE } from '@/lib/clientes'
import type { EtapaPipeline } from '@/types/clientes'

interface FormState {
  nombre: string
  email: string
  telefono: string
  whatsapp: string
  numero_contrato: string
  provincia: string
  notas: string
  etapa_pipeline: EtapaPipeline
}

const FORM_INICIAL: FormState = {
  nombre: '',
  email: '',
  telefono: '',
  whatsapp: '',
  numero_contrato: '',
  provincia: '',
  notas: '',
  etapa_pipeline: 'prospecto',
}

export function FormularioNuevoCliente() {
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function actualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function guardar() {
    if (!form.nombre.trim()) {
      setError('El nombre del cliente es requerido')
      return
    }

    setError(null)

    startTransition(async () => {
      const response = await crearCliente(form)
      if (response?.error) {
        setError(response.error)
      }
    })
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nombre"
            placeholder="Nombre del cliente o empresa"
            value={form.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
          />
        </div>

        <Input
          label="Telefono"
          placeholder="809-555-1234"
          value={form.telefono}
          onChange={(e) => actualizar('telefono', e.target.value)}
        />

        <Input
          label="WhatsApp"
          placeholder="809-555-1234"
          value={form.whatsapp}
          onChange={(e) => actualizar('whatsapp', e.target.value)}
        />

        <Input
          label="Email"
          placeholder="cliente@empresa.com"
          value={form.email}
          onChange={(e) => actualizar('email', e.target.value)}
        />

        <Input
          label="Numero de contrato"
          placeholder="123456789"
          value={form.numero_contrato}
          onChange={(e) => actualizar('numero_contrato', e.target.value)}
        />

        <Input
          label="Provincia"
          placeholder="Santiago"
          value={form.provincia}
          onChange={(e) => actualizar('provincia', e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-[var(--text-2)]">Etapa inicial</label>
          <select
            value={form.etapa_pipeline}
            onChange={(e) => actualizar('etapa_pipeline', e.target.value as EtapaPipeline)}
            className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            {ETAPAS_PIPELINE.map((etapa) => (
              <option key={etapa} value={etapa}>
                {ETIQUETAS_ETAPA_PIPELINE[etapa]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <Textarea
            label="Notas"
            placeholder="Observaciones iniciales del cliente..."
            rows={4}
            value={form.notas}
            onChange={(e) => actualizar('notas', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {error ? <p className="text-[12px] text-[var(--red)]">{error}</p> : <span />}
        <Button variant="accent" onClick={guardar} loading={isPending}>
          Guardar cliente
        </Button>
      </div>
    </div>
  )
}
