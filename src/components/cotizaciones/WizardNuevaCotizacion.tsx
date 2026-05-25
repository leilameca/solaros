'use client'

import { type ReactNode, useEffect, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Check, Sun, TrendingUp, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useCalculo } from '@/hooks/useCalculo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { crearCotizacion } from '@/app/(dashboard)/cotizaciones/actions'
import {
  ETIQUETAS_SISTEMA,
  ETIQUETAS_TARIFA,
  PANEL_W_DEFAULT,
  PROVINCIAS_RD,
} from '@/lib/constants'
import { formatearNumero, formatearRD, formatearUSD } from '@/lib/calculos'
import type {
  EmpresaConfig,
  ItemInventario,
  TipoSistema,
  TipoTarifa,
} from '@/types/cotizaciones'

interface Props {
  empresaConfig: EmpresaConfig
  paneles: ItemInventario[]
  inversores: ItemInventario[]
  clienteInicial?: {
    id: string
    nombre: string
    numero_contrato: string | null
    provincia: string | null
  } | null
}

interface FormData {
  nombreTitular: string
  numeroContrato: string
  provincia: string
  tarifa: TipoTarifa | ''
  tipoSistema: TipoSistema | ''
  kwhMensual: number | ''
  panelMarca: string
  panelModelo: string
  panelPotenciaW: number | ''
  panelCantidad: number | ''
  inversorMarca: string
  inversorModelo: string
  inversorKw: number | ''
  inversorCantidad: number | ''
  ley5707Activa: boolean
  notas: string
}

const FORM_INICIAL: FormData = {
  nombreTitular: '',
  numeroContrato: '',
  provincia: '',
  tarifa: '',
  tipoSistema: '',
  kwhMensual: '',
  panelMarca: '',
  panelModelo: '',
  panelPotenciaW: PANEL_W_DEFAULT,
  panelCantidad: '',
  inversorMarca: '',
  inversorModelo: '',
  inversorKw: '',
  inversorCantidad: 1,
  ley5707Activa: false,
  notas: '',
}

const PASOS = ['Datos del cliente', 'Consumo y equipo', 'Resumen financiero']

function crearFormularioInicial(clienteInicial?: Props['clienteInicial']): FormData {
  return {
    ...FORM_INICIAL,
    nombreTitular: clienteInicial?.nombre ?? '',
    numeroContrato: clienteInicial?.numero_contrato ?? '',
    provincia: clienteInicial?.provincia ?? '',
  }
}

export function WizardNuevaCotizacion({
  empresaConfig,
  paneles,
  inversores,
  clienteInicial,
}: Props) {
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState<FormData>(() => crearFormularioInicial(clienteInicial))
  const [errores, setErrores] = useState<Partial<Record<keyof FormData, string>>>({})
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const clientePrefillKey = clienteInicial?.id ?? 'nuevo'

  useEffect(() => {
    setPaso(0)
    setForm(crearFormularioInicial(clienteInicial))
    setErrores({})
    setErrorSubmit(null)
  }, [clientePrefillKey, clienteInicial])

  const { resultado, ley5707, esValido } = useCalculo({
    kwhMensual: typeof form.kwhMensual === 'number' ? form.kwhMensual : undefined,
    provincia: form.provincia || undefined,
    tarifa: (form.tarifa as TipoTarifa) || undefined,
    panelW: typeof form.panelPotenciaW === 'number' ? form.panelPotenciaW : undefined,
    precioWp: empresaConfig.precio_wp,
    tasaDolar: empresaConfig.tasa_dolar,
    ley5707Activa: form.ley5707Activa,
  })

  function actualizar<K extends keyof FormData>(campo: K, valor: FormData[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }))
    }
  }

  function validarPaso0() {
    const nuevosErrores: Partial<Record<keyof FormData, string>> = {}
    if (!form.nombreTitular.trim()) nuevosErrores.nombreTitular = 'El nombre es requerido'
    if (!form.provincia) nuevosErrores.provincia = 'Selecciona una provincia'
    if (!form.tarifa) nuevosErrores.tarifa = 'Selecciona la tarifa eléctrica'
    if (!form.tipoSistema) nuevosErrores.tipoSistema = 'Selecciona el tipo de sistema'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  function validarPaso1() {
    const nuevosErrores: Partial<Record<keyof FormData, string>> = {}

    if (!form.kwhMensual || Number(form.kwhMensual) <= 0) {
      nuevosErrores.kwhMensual = 'Ingresa el consumo mensual'
    }

    if (!form.panelPotenciaW || Number(form.panelPotenciaW) <= 0) {
      nuevosErrores.panelPotenciaW = 'Ingresa la potencia del panel'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  function avanzar() {
    if (paso === 0 && !validarPaso0()) return
    if (paso === 1 && !validarPaso1()) return
    setPaso((prev) => prev + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function retroceder() {
    setPaso((prev) => prev - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function seleccionarPanel(panel: ItemInventario) {
    actualizar('panelMarca', panel.marca)
    actualizar('panelModelo', panel.modelo)
    actualizar('panelPotenciaW', panel.potencia_w ?? PANEL_W_DEFAULT)
  }

  function seleccionarInversor(inversor: ItemInventario) {
    actualizar('inversorMarca', inversor.marca)
    actualizar('inversorModelo', inversor.modelo)
    actualizar('inversorKw', inversor.potencia_kw ?? '')
  }

  function enviar() {
    if (!esValido || !form.tarifa || !form.tipoSistema) {
      setErrorSubmit('Completa los datos requeridos antes de guardar la cotización.')
      return
    }

    setErrorSubmit(null)

    startTransition(async () => {
      const response = await crearCotizacion({
        clienteId: clienteInicial?.id ?? null,
        nombreTitular: form.nombreTitular,
        numeroContrato: form.numeroContrato,
        provincia: form.provincia,
        tarifa: form.tarifa as TipoTarifa,
        tipoSistema: form.tipoSistema as TipoSistema,
        kwhMensual: Number(form.kwhMensual),
        panelMarca: form.panelMarca,
        panelModelo: form.panelModelo,
        panelPotenciaW: Number(form.panelPotenciaW),
        panelCantidad: resultado?.cantidadPaneles ?? Number(form.panelCantidad),
        inversorMarca: form.inversorMarca,
        inversorModelo: form.inversorModelo,
        inversorKw: Number(form.inversorKw),
        inversorCantidad: Number(form.inversorCantidad),
        ley5707Activa: form.ley5707Activa,
        notas: form.notas,
      })

      if (response?.error) {
        setErrorSubmit(response.error)
        toast.error(response.error)
      }
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {PASOS.map((nombre, index) => (
          <div key={nombre} className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors ${
                index < paso
                  ? 'bg-[var(--green)] text-white'
                  : index === paso
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]'
              }`}
            >
              {index < paso ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span
              className={`text-[13px] hidden sm:block ${
                index === paso ? 'text-[var(--text)] font-medium' : 'text-[var(--text-3)]'
              }`}
            >
              {nombre}
            </span>
            {index < PASOS.length - 1 ? (
              <ChevronRight className="h-4 w-4 text-[var(--text-3)] mx-1" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {paso === 0 ? (
          <Paso1
            form={form}
            errores={errores}
            actualizar={actualizar}
            clienteInicial={clienteInicial}
          />
        ) : null}

        {paso === 1 ? (
          <Paso2
            form={form}
            errores={errores}
            actualizar={actualizar}
            resultado={resultado}
            paneles={paneles}
            inversores={inversores}
            onSeleccionarPanel={seleccionarPanel}
            onSeleccionarInversor={seleccionarInversor}
          />
        ) : null}

        {paso === 2 ? (
          <Paso3
            form={form}
            actualizar={actualizar}
            resultado={resultado}
            ley5707={ley5707}
            precioWp={empresaConfig.precio_wp}
          />
        ) : null}
      </div>

      <div className="sticky bottom-14 md:static z-10 bg-[var(--bg)] md:bg-transparent border-t border-[var(--border)] md:border-t-0 -mx-5 md:mx-0 px-5 md:px-0 py-3 md:py-0 md:mt-4 space-y-3">
        {errorSubmit ? (
          <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius-sm)] p-3">
            <p className="text-[12px] text-[var(--red)]">{errorSubmit}</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={retroceder}
            disabled={paso === 0 || isPending}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Atras
          </Button>

          {paso < PASOS.length - 1 ? (
            <Button variant="accent" onClick={avanzar} disabled={isPending}>
              Continuar
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={enviar}
              loading={isPending}
              disabled={!esValido || isPending}
            >
              <Check className="h-3.5 w-3.5" />
              Guardar cotizacion
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Paso1({
  form,
  errores,
  actualizar,
  clienteInicial,
}: {
  form: FormData
  errores: Partial<Record<keyof FormData, string>>
  actualizar: <K extends keyof FormData>(campo: K, valor: FormData[K]) => void
  clienteInicial?: Props['clienteInicial']
}) {
  return (
    <div className="p-6">
      <h2 className="text-[15px] font-medium text-[var(--text)] mb-1">Datos del cliente</h2>
      <p className="text-[13px] text-[var(--text-3)] mb-6">
        Información básica del titular y tipo de instalación.
      </p>

      {clienteInicial ? (
        <div className="mb-6 bg-[var(--blue-bg)] border border-[var(--blue)] rounded-[var(--radius-sm)] p-3">
          <p className="text-[13px] text-[var(--blue)] font-medium">
            Cliente prellenado desde CRM
          </p>
          <p className="text-[12px] text-[var(--blue)] mt-1">
            Puedes ajustar los datos antes de guardar la cotización.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nombre del titular"
            placeholder="Juan Perez"
            value={form.nombreTitular}
            onChange={(e) => actualizar('nombreTitular', e.target.value)}
            error={errores.nombreTitular}
          />
        </div>

        <Input
          label="Número de contrato eléctrico"
          placeholder="12345678"
          value={form.numeroContrato}
          onChange={(e) => actualizar('numeroContrato', e.target.value)}
        />

        <Select value={form.provincia} onValueChange={(v) => actualizar('provincia', v)}>
          <SelectTrigger label="Provincia" error={errores.provincia}>
            <SelectValue placeholder="Seleccionar provincia" />
          </SelectTrigger>
          <SelectContent>
            {PROVINCIAS_RD.map((provincia) => (
              <SelectItem key={provincia} value={provincia}>
                {provincia}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={form.tarifa} onValueChange={(v) => actualizar('tarifa', v as TipoTarifa)}>
          <SelectTrigger label="Tarifa electrica" error={errores.tarifa}>
            <SelectValue placeholder="Seleccionar tarifa" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ETIQUETAS_TARIFA).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={form.tipoSistema}
          onValueChange={(v) => actualizar('tipoSistema', v as TipoSistema)}
        >
          <SelectTrigger label="Tipo de sistema" error={errores.tipoSistema}>
            <SelectValue placeholder="Seleccionar sistema" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ETIQUETAS_SISTEMA).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function Paso2({
  form,
  errores,
  actualizar,
  resultado,
  paneles,
  inversores,
  onSeleccionarPanel,
  onSeleccionarInversor,
}: {
  form: FormData
  errores: Partial<Record<keyof FormData, string>>
  actualizar: <K extends keyof FormData>(campo: K, valor: FormData[K]) => void
  resultado: ReturnType<typeof useCalculo>['resultado']
  paneles: ItemInventario[]
  inversores: ItemInventario[]
  onSeleccionarPanel: (panel: ItemInventario) => void
  onSeleccionarInversor: (inversor: ItemInventario) => void
}) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-[15px] font-medium text-[var(--text)] mb-1">Consumo y equipo</h2>
        <p className="text-[13px] text-[var(--text-3)]">
          Ingresa el consumo mensual y revisa el cálculo automático.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Consumo mensual (KWh)"
          type="number"
          placeholder="850"
          min={1}
          value={form.kwhMensual === '' ? '' : form.kwhMensual}
          onChange={(e) =>
            actualizar('kwhMensual', e.target.value === '' ? '' : Number(e.target.value))
          }
          error={errores.kwhMensual}
          hint="Dato de la factura eléctrica del cliente"
        />

        <Input
          label="Potencia del panel (W)"
          type="number"
          placeholder="550"
          min={100}
          value={form.panelPotenciaW === '' ? '' : form.panelPotenciaW}
          onChange={(e) =>
            actualizar(
              'panelPotenciaW',
              e.target.value === '' ? '' : Number(e.target.value)
            )
          }
          error={errores.panelPotenciaW}
        />
      </div>

      {resultado ? (
        <div className="bg-[var(--accent-bg)] border border-[var(--accent-bd)] rounded-[var(--radius)] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--accent)] font-[family-name:var(--font-mono)] mb-3">
            Cálculo automático
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricaCalculo
              label="KWp requerido"
              valor={formatearNumero(resultado.kwpReal, 2)}
              unidad="KWp"
              icon={<Sun className="h-3.5 w-3.5" />}
            />
            <MetricaCalculo
              label="Cantidad paneles"
              valor={resultado.cantidadPaneles.toString()}
              unidad="und"
              icon={<Zap className="h-3.5 w-3.5" />}
            />
            <MetricaCalculo
              label="Generación mensual"
              valor={formatearNumero(resultado.generacionMensual, 0)}
              unidad="KWh"
              icon={<Sun className="h-3.5 w-3.5" />}
            />
            <MetricaCalculo
              label="Total estimado"
              valor={formatearUSD(resultado.totalUsd)}
              unidad=""
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      ) : null}

      <Separator />

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
          Panel solar
        </p>

        {paneles.length > 0 ? (
          <div className="flex gap-2 flex-wrap mb-3">
            {paneles.slice(0, 4).map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => onSeleccionarPanel(panel)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-sm bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue)] hover:border-[var(--blue)] transition-colors"
              >
                {panel.marca} {panel.modelo} {panel.potencia_w}W
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input
            label="Marca"
            placeholder="Jinko, Canadian"
            value={form.panelMarca}
            onChange={(e) => actualizar('panelMarca', e.target.value)}
          />
          <Input
            label="Modelo"
            placeholder="Tiger Neo 550"
            value={form.panelModelo}
            onChange={(e) => actualizar('panelModelo', e.target.value)}
          />
          <Input
            label="Cantidad"
            type="number"
            placeholder={resultado ? resultado.cantidadPaneles.toString() : '-'}
            value={
              resultado
                ? resultado.cantidadPaneles
                : form.panelCantidad === ''
                ? ''
                : form.panelCantidad
            }
            readOnly={Boolean(resultado)}
            className={resultado ? 'bg-[var(--surface-2)] cursor-not-allowed' : ''}
            onChange={(e) =>
              actualizar('panelCantidad', e.target.value === '' ? '' : Number(e.target.value))
            }
            hint={resultado ? 'Calculado automaticamente' : ''}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
          Inversor
        </p>

        {inversores.length > 0 ? (
          <div className="flex gap-2 flex-wrap mb-3">
            {inversores.slice(0, 4).map((inversor) => (
              <button
                key={inversor.id}
                type="button"
                onClick={() => onSeleccionarInversor(inversor)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-sm bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue)] hover:border-[var(--blue)] transition-colors"
              >
                {inversor.marca} {inversor.modelo} {inversor.potencia_kw}kW
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            label="Marca"
            placeholder="Growatt, Huawei"
            value={form.inversorMarca}
            onChange={(e) => actualizar('inversorMarca', e.target.value)}
          />
          <Input
            label="Modelo"
            placeholder="MID 15KTL3-X"
            value={form.inversorModelo}
            onChange={(e) => actualizar('inversorModelo', e.target.value)}
          />
          <Input
            label="Potencia (kW)"
            type="number"
            placeholder={resultado ? formatearNumero(resultado.kwpReal, 1) : '15'}
            value={form.inversorKw === '' ? '' : form.inversorKw}
            onChange={(e) =>
              actualizar('inversorKw', e.target.value === '' ? '' : Number(e.target.value))
            }
          />
          <Input
            label="Cantidad"
            type="number"
            placeholder="1"
            min={1}
            value={form.inversorCantidad === '' ? '' : form.inversorCantidad}
            onChange={(e) =>
              actualizar(
                'inversorCantidad',
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
          />
        </div>
      </div>
    </div>
  )
}

function Paso3({
  form,
  actualizar,
  resultado,
  ley5707,
  precioWp,
}: {
  form: FormData
  actualizar: <K extends keyof FormData>(campo: K, valor: FormData[K]) => void
  resultado: ReturnType<typeof useCalculo>['resultado']
  ley5707: ReturnType<typeof useCalculo>['ley5707']
  precioWp: number
}) {
  if (!resultado) {
    return (
      <div className="p-6 text-center text-[13px] text-[var(--text-3)]">
        Completa los datos anteriores para ver el resumen financiero.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-[15px] font-medium text-[var(--text)] mb-1">Resumen financiero</h2>
        <p className="text-[13px] text-[var(--text-3)]">
          Revisa los números antes de guardar la cotización.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TarjetaMetrica
          label="Sistema"
          valor={formatearNumero(resultado.kwpReal, 2)}
          unidad="KWp"
          subtitulo={`${resultado.cantidadPaneles} paneles`}
        />
        <TarjetaMetrica
          label="Generacion mensual"
          valor={formatearNumero(resultado.generacionMensual, 0)}
          unidad="KWh"
          subtitulo={`${formatearNumero(resultado.generacionAnual, 0)} KWh/año`}
        />
        <TarjetaMetrica
          label="Ahorro mensual"
          valor={formatearRD(resultado.ahorroMensualRd)}
          unidad=""
          subtitulo={`${formatearUSD(resultado.ahorroAnualUsd)}/ano`}
        />
        <TarjetaMetrica
          label="Inversion total"
          valor={formatearUSD(resultado.totalUsd)}
          unidad=""
          subtitulo={`$${precioWp}/Wp`}
          destaca
        />
      </div>

      <div className="bg-[var(--surface-2)] rounded-[var(--radius)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[var(--text)]">Ley 57-07</p>
            <p className="text-[12px] text-[var(--text-3)] mt-0.5">
              Descuento fiscal del 38% sobre paneles e inversores en 3 anos.
            </p>
          </div>
          <Switch
            checked={form.ley5707Activa}
            onCheckedChange={(valor) => actualizar('ley5707Activa', valor)}
          />
        </div>

        {form.ley5707Activa && ley5707 ? (
          <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                Descuento/ano
              </p>
              <p className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--green)]">
                {formatearUSD(ley5707.descuentoAnualUsd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                Inversion neta
              </p>
              <p className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--text)]">
                {formatearUSD(ley5707.inversionNetaUsd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                Retorno con ley
              </p>
              <p className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--accent)]">
                {ley5707.retornoConLey} anos
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
                Retorno sin ley
              </p>
              <p className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--text-2)]">
                {resultado.retornoSinLey} anos
              </p>
            </div>
          </div>
        ) : null}

        {!form.ley5707Activa ? (
          <div className="mt-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
              Tiempo de retorno
            </p>
            <p className="font-[family-name:var(--font-mono)] text-[14px] font-medium text-[var(--accent)]">
              {resultado.retornoSinLey} anos
            </p>
          </div>
        ) : null}
      </div>

      <Textarea
        label="Notas (opcional)"
        placeholder="Observaciones adicionales para esta cotización..."
        value={form.notas}
        onChange={(e) => actualizar('notas', e.target.value)}
        rows={3}
      />
    </div>
  )
}

function MetricaCalculo({
  label,
  valor,
  unidad,
  icon,
}: {
  label: string
  valor: string
  unidad: string
  icon: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[var(--accent)] mb-1">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
          {label}
        </p>
      </div>
      <p className="font-[family-name:var(--font-mono)] text-[15px] font-medium text-[var(--text)]">
        {valor}
        {unidad ? <span className="text-[var(--text-3)] text-[11px] ml-1">{unidad}</span> : null}
      </p>
    </div>
  )
}

function TarjetaMetrica({
  label,
  valor,
  unidad,
  subtitulo,
  destaca,
}: {
  label: string
  valor: string
  unidad: string
  subtitulo: string
  destaca?: boolean
}) {
  return (
    <div
      className={`rounded-[var(--radius)] p-3 border ${
        destaca
          ? 'bg-[var(--accent-bg)] border-[var(--accent-bd)]'
          : 'bg-[var(--surface-2)] border-[var(--border)]'
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1.5">
        {label}
      </p>
      <p
        className={`font-[family-name:var(--font-mono)] text-[15px] font-medium ${
          destaca ? 'text-[var(--accent)]' : 'text-[var(--text)]'
        }`}
      >
        {valor}
        {unidad ? <span className="text-[var(--text-3)] text-[11px] ml-1">{unidad}</span> : null}
      </p>
      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{subtitulo}</p>
    </div>
  )
}
