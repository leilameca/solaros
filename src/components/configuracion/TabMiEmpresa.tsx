'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROVINCIAS_RD } from '@/lib/constants'
import { guardarDatosEmpresa } from '@/app/(dashboard)/configuracion/actions'
import type {
  EmpresaConfiguracion,
  FeedbackConfiguracion,
  GuardarEmpresaInput,
} from '@/types/configuracion'

interface ErroresEmpresa {
  nombre?: string
  telefono?: string
}

function normalizarEmpresa(empresa: EmpresaConfiguracion): GuardarEmpresaInput {
  return {
    nombre: empresa.nombre,
    rnc: empresa.rnc,
    telefono: empresa.telefono,
    email: empresa.email,
    direccion: empresa.direccion,
    provincia: empresa.provincia,
    representante: empresa.representante,
    cargo_representante: empresa.cargo_representante,
  }
}

export function TabMiEmpresa({
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
  const router = useRouter()
  const [guardando, startTransition] = useTransition()
  const [baseForm, setBaseForm] = useState<GuardarEmpresaInput>(() => normalizarEmpresa(empresa))
  const [form, setForm] = useState<GuardarEmpresaInput>(() => normalizarEmpresa(empresa))
  const [errores, setErrores] = useState<ErroresEmpresa>({})

  useEffect(() => {
    const dirty = JSON.stringify(baseForm) !== JSON.stringify(form)
    onDirtyChange(dirty)
  }, [baseForm, form, onDirtyChange])

  function actualizar<K extends keyof GuardarEmpresaInput>(campo: K, valor: GuardarEmpresaInput[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function validar() {
    const siguientesErrores: ErroresEmpresa = {}

    if (!form.nombre.trim()) {
      siguientesErrores.nombre = 'El nombre es obligatorio.'
    }

    if (!form.telefono.trim()) {
      siguientesErrores.telefono = 'El telefono es obligatorio.'
    }

    setErrores(siguientesErrores)
    return Object.keys(siguientesErrores).length === 0
  }

  function handleGuardar() {
    if (!validar()) return

    startTransition(async () => {
      const resultado = await guardarDatosEmpresa(form)

      if (resultado.error) {
        onFeedback({ type: 'error', message: resultado.error })
        return
      }

      setBaseForm(form)
      setErrores({})
      onFeedback({
        type: 'success',
        message: resultado.message ?? 'Datos actualizados correctamente.',
      })

      if (modoInicial) {
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
          Datos legales y de contacto
        </p>
        <p className="text-[13px] text-[var(--text-2)]">
          {modoInicial
            ? 'Este primer guardado crea tu empresa y conecta tu usuario como administrador.'
            : 'Estos datos se usan en cabeceras, propuestas y contacto comercial.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre comercial"
          value={form.nombre}
          onChange={(event) => actualizar('nombre', event.target.value)}
          error={errores.nombre}
          placeholder="SolarOS RD"
        />
        <Input
          label="RNC"
          value={form.rnc}
          onChange={(event) => actualizar('rnc', event.target.value)}
          placeholder="1-31-00000-0"
        />
        <Input
          label="Telefono"
          value={form.telefono}
          onChange={(event) => actualizar('telefono', event.target.value)}
          error={errores.telefono}
          placeholder="809-555-0101"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => actualizar('email', event.target.value)}
          placeholder="ventas@empresa.com"
        />
        <Input
          label="Direccion"
          value={form.direccion}
          onChange={(event) => actualizar('direccion', event.target.value)}
          placeholder="Av. Principal 123"
        />
        <div className="space-y-1">
          <label className="text-[12px] font-medium text-[var(--text-2)]">Provincia</label>
          <Select
            value={form.provincia || undefined}
            onValueChange={(valor) => actualizar('provincia', valor)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una provincia" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCIAS_RD.map((provincia) => (
                <SelectItem key={provincia} value={provincia}>
                  {provincia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          label="Representante legal"
          value={form.representante}
          onChange={(event) => actualizar('representante', event.target.value)}
          placeholder="Nombre del representante"
        />
        <Input
          label="Cargo del representante"
          value={form.cargo_representante}
          onChange={(event) => actualizar('cargo_representante', event.target.value)}
          placeholder="Gerente general"
        />
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="accent"
          onClick={handleGuardar}
          loading={guardando}
          disabled={guardando}
        >
          {modoInicial ? 'Crear empresa' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
