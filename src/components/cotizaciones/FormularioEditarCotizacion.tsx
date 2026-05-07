'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { actualizarCotizacion } from '@/app/(dashboard)/cotizaciones/actions'
import {
  PROVINCIAS_RD,
  ETIQUETAS_TARIFA,
  ETIQUETAS_SISTEMA,
  PANEL_W_DEFAULT,
} from '@/lib/constants'
import type { Cotizacion, TipoTarifa, TipoSistema } from '@/types/cotizaciones'

const TARIFAS = Object.keys(ETIQUETAS_TARIFA) as TipoTarifa[]

interface Props {
  cotizacion: Cotizacion
}

export function FormularioEditarCotizacion({ cotizacion }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [provincia, setProvincia] = useState(cotizacion.provincia)
  const [tarifa, setTarifa] = useState<TipoTarifa>(cotizacion.tarifa)
  const [tipoSistema, setTipoSistema] = useState<TipoSistema>(cotizacion.tipo_sistema)
  const [kwhMensual, setKwhMensual] = useState(cotizacion.kwh_mensual.toString())

  const [panelMarca, setPanelMarca] = useState(cotizacion.panel_marca ?? '')
  const [panelModelo, setPanelModelo] = useState(cotizacion.panel_modelo ?? '')
  const [panelPotenciaW, setPanelPotenciaW] = useState(
    (cotizacion.panel_potencia_w ?? PANEL_W_DEFAULT).toString()
  )

  const [inversorMarca, setInversorMarca] = useState(cotizacion.inversor_marca ?? '')
  const [inversorModelo, setInversorModelo] = useState(cotizacion.inversor_modelo ?? '')
  const [inversorKw, setInversorKw] = useState(cotizacion.inversor_kw?.toString() ?? '')
  const [inversorCantidad, setInversorCantidad] = useState(
    cotizacion.inversor_cantidad?.toString() ?? ''
  )

  const [ley5707Activa, setLey5707Activa] = useState(cotizacion.ley_5707_activa)
  const [notas, setNotas] = useState(cotizacion.notas ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const kwh = parseFloat(kwhMensual)
    const panelW = parseFloat(panelPotenciaW)

    if (!provincia) { setError('Selecciona una provincia.'); return }
    if (!kwh || kwh <= 0) { setError('El consumo mensual debe ser mayor a 0.'); return }
    if (!panelW || panelW <= 0) { setError('La potencia del panel debe ser mayor a 0.'); return }

    startTransition(async () => {
      const result = await actualizarCotizacion(cotizacion.id, {
        provincia,
        tarifa,
        tipoSistema,
        kwhMensual: kwh,
        panelMarca,
        panelModelo,
        panelPotenciaW: panelW,
        inversorMarca,
        inversorModelo,
        inversorKw: inversorKw ? parseFloat(inversorKw) : null,
        inversorCantidad: inversorCantidad ? parseInt(inversorCantidad, 10) : null,
        ley5707Activa,
        notas,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Sección: Consumo y ubicación */}
      <SeccionFormulario titulo="Consumo y ubicación">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select value={provincia} onValueChange={setProvincia}>
            <SelectTrigger label="Provincia">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCIAS_RD.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tarifa} onValueChange={(v) => setTarifa(v as TipoTarifa)}>
            <SelectTrigger label="Tarifa eléctrica">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {TARIFAS.map((t) => (
                <SelectItem key={t} value={t}>{ETIQUETAS_TARIFA[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select value={tipoSistema} onValueChange={(v) => setTipoSistema(v as TipoSistema)}>
            <SelectTrigger label="Tipo de sistema">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(ETIQUETAS_SISTEMA) as [TipoSistema, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            label="Consumo mensual (KWh)"
            type="number"
            min="1"
            step="1"
            value={kwhMensual}
            onChange={(e) => setKwhMensual(e.target.value)}
            placeholder="850"
            required
          />
        </div>
      </SeccionFormulario>

      {/* Sección: Panel solar */}
      <SeccionFormulario titulo="Panel solar">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Marca"
            value={panelMarca}
            onChange={(e) => setPanelMarca(e.target.value)}
            placeholder="Longi, JA Solar…"
          />
          <Input
            label="Modelo"
            value={panelModelo}
            onChange={(e) => setPanelModelo(e.target.value)}
            placeholder="Hi-MO 6"
          />
          <Input
            label="Potencia (W)"
            type="number"
            min="1"
            step="1"
            value={panelPotenciaW}
            onChange={(e) => setPanelPotenciaW(e.target.value)}
            placeholder="550"
            required
            hint="Determina la cantidad de paneles"
          />
        </div>
      </SeccionFormulario>

      {/* Sección: Inversor */}
      <SeccionFormulario titulo="Inversor">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Marca"
            value={inversorMarca}
            onChange={(e) => setInversorMarca(e.target.value)}
            placeholder="Growatt, Solis…"
          />
          <Input
            label="Modelo"
            value={inversorModelo}
            onChange={(e) => setInversorModelo(e.target.value)}
            placeholder="MIN 6000TL-X"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Potencia (kW)"
            type="number"
            min="0.1"
            step="0.1"
            value={inversorKw}
            onChange={(e) => setInversorKw(e.target.value)}
            placeholder="6"
          />
          <Input
            label="Cantidad"
            type="number"
            min="1"
            step="1"
            value={inversorCantidad}
            onChange={(e) => setInversorCantidad(e.target.value)}
            placeholder="1"
          />
        </div>
      </SeccionFormulario>

      {/* Sección: Opciones */}
      <SeccionFormulario titulo="Opciones">
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <div
            role="checkbox"
            aria-checked={ley5707Activa}
            tabIndex={0}
            onClick={() => setLey5707Activa((v) => !v)}
            onKeyDown={(e) => e.key === ' ' && setLey5707Activa((v) => !v)}
            className={`h-4 w-4 rounded border transition-colors flex items-center justify-center flex-shrink-0 ${
              ley5707Activa
                ? 'bg-[var(--accent)] border-[var(--accent)]'
                : 'bg-[var(--surface)] border-[var(--border-s)]'
            }`}
          >
            {ley5707Activa && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text)]">Ley 57-07 activa</p>
            <p className="text-[11px] text-[var(--text-3)]">
              Aplica incentivo fiscal del 38% sobre la inversión (3 años)
            </p>
          </div>
        </label>
      </SeccionFormulario>

      {/* Notas */}
      <SeccionFormulario titulo="Notas">
        <Textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones, condiciones especiales, acuerdos…"
          rows={3}
        />
      </SeccionFormulario>

      {error && (
        <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="accent" loading={isPending}>
          Guardar cambios
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function SeccionFormulario({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          {titulo}
        </p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}
