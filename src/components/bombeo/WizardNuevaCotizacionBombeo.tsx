'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CalculadoraBombeo, calcularCantidadPanelesBombeo, useCalculoBombeo } from '@/components/bombeo/CalculadoraBombeo'
import { DesglosePrecio, calcularTotalDesgloseBombeo } from '@/components/bombeo/DesglosePrecio'
import { SelectorEquipoBombeo, type SelectorEquipoValores } from '@/components/bombeo/SelectorEquipoBombeo'
import { crearCotizacionBombeo } from '@/app/(dashboard)/bombeo/actions'
import { PROVINCIAS_RD } from '@/lib/constants'
import { formatearUSD } from '@/lib/calculos'
import type {
  ClienteBombeo,
  DesglosePrecioBombeo,
  EmpresaConfigBombeo,
  ItemInventarioBombeo,
  TipoBomba,
  TipoSistemaBombeo,
} from '@/types/bombeo'

const PASOS = ['Tipo y cliente', 'Datos técnicos', 'Precio y resumen']

const ETIQUETAS_SISTEMA: Record<TipoSistemaBombeo, string> = {
  solar_directo: 'Solar directo',
  solar_vfd: 'Solar con VFD',
  electrico: 'Eléctrico',
}

const ETIQUETAS_BOMBA: Record<TipoBomba, string> = {
  sumergible: 'Sumergible',
  superficial: 'Superficial',
}

interface FormData {
  clienteNombre: string
  clienteId: string | null
  provincia: string
  tipoSistema: TipoSistemaBombeo
  tipoBomba: TipoBomba
  profundidadM: number | ''
  caudalM3h: number | ''
  litrosDiaRequeridos: number | ''
  alturaDescargaM: number | ''
  bombaMarca: string
  bombaModelo: string
  bombaHp: number | ''
  bombaPrecio: number | ''
  panelMarca: string
  panelModelo: string
  panelW: number | ''
  panelCantidad: number | ''
  panelPrecioUnit: number | ''
  vfdMarca: string
  vfdModelo: string
  vfdKw: number | ''
  vfdPrecio: number | ''
  instalacionUsd: number | ''
  notas: string
}

const FORM_INICIAL: FormData = {
  clienteNombre: '',
  clienteId: null,
  provincia: '',
  tipoSistema: 'solar_directo',
  tipoBomba: 'sumergible',
  profundidadM: '',
  caudalM3h: '',
  litrosDiaRequeridos: '',
  alturaDescargaM: '',
  bombaMarca: '',
  bombaModelo: '',
  bombaHp: '',
  bombaPrecio: '',
  panelMarca: '',
  panelModelo: '',
  panelW: '',
  panelCantidad: '',
  panelPrecioUnit: '',
  vfdMarca: '',
  vfdModelo: '',
  vfdKw: '',
  vfdPrecio: '',
  instalacionUsd: 0,
  notas: '',
}

function numeroSeguro(valor: number | '') {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : 0
}

export function WizardNuevaCotizacionBombeo({
  empresaConfig,
  clientes,
  bombas,
  paneles,
  vfds,
  clienteInicial,
}: {
  empresaConfig: EmpresaConfigBombeo
  clientes: ClienteBombeo[]
  bombas: ItemInventarioBombeo[]
  paneles: ItemInventarioBombeo[]
  vfds: ItemInventarioBombeo[]
  clienteInicial?: ClienteBombeo | null
}) {
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState<FormData>(() => ({
    ...FORM_INICIAL,
    clienteNombre: clienteInicial?.nombre ?? '',
    clienteId: clienteInicial?.id ?? null,
    provincia: clienteInicial?.provincia ?? '',
  }))
  const [errores, setErrores] = useState<Partial<Record<keyof FormData, string>>>({})
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null)
  const [estadoEnvio, setEstadoEnvio] = useState<'borrador' | 'enviada'>('borrador')
  const [isPending, startTransition] = useTransition()
  const clientePrefillKey = clienteInicial?.id ?? 'nuevo'

  useEffect(() => {
    setPaso(0)
    setForm({
      ...FORM_INICIAL,
      clienteNombre: clienteInicial?.nombre ?? '',
      clienteId: clienteInicial?.id ?? null,
      provincia: clienteInicial?.provincia ?? '',
    })
    setErrores({})
    setErrorSubmit(null)
    setEstadoEnvio('borrador')
  }, [clientePrefillKey, clienteInicial])

  const calculoInput = useMemo(() => ({
    tipo_sistema: form.tipoSistema,
    tipo_bomba: form.tipoBomba,
    provincia: form.provincia || undefined,
    profundidad_m: typeof form.profundidadM === 'number' ? form.profundidadM : undefined,
    caudal_m3h: typeof form.caudalM3h === 'number' ? form.caudalM3h : undefined,
    litros_dia_requeridos: typeof form.litrosDiaRequeridos === 'number' ? form.litrosDiaRequeridos : undefined,
    altura_descarga_m: typeof form.alturaDescargaM === 'number' ? form.alturaDescargaM : undefined,
  }), [form.tipoSistema, form.tipoBomba, form.provincia, form.profundidadM, form.caudalM3h, form.litrosDiaRequeridos, form.alturaDescargaM])

  const { resultado, esValido } = useCalculoBombeo(calculoInput)

  const selectorEquipo: SelectorEquipoValores = {
    bombaMarca: form.bombaMarca,
    bombaModelo: form.bombaModelo,
    bombaHp: form.bombaHp,
    bombaPrecio: form.bombaPrecio,
    panelMarca: form.panelMarca,
    panelModelo: form.panelModelo,
    panelW: form.panelW,
    panelCantidad: form.panelCantidad,
    panelPrecioUnit: form.panelPrecioUnit,
    vfdMarca: form.vfdMarca,
    vfdModelo: form.vfdModelo,
    vfdKw: form.vfdKw,
    vfdPrecio: form.vfdPrecio,
  }

  const panelCantidadSugerida = resultado
    ? calcularCantidadPanelesBombeo(
        resultado.kwp_necesario,
        typeof form.panelW === 'number' ? form.panelW : undefined
      )
    : 0

  const desglose: DesglosePrecioBombeo = {
    bombaPrecio: form.bombaPrecio,
    panelPrecioUnit: form.panelPrecioUnit,
    panelCantidad: form.panelCantidad === '' ? panelCantidadSugerida : form.panelCantidad,
    vfdPrecio: form.vfdPrecio,
    instalacionUsd: form.instalacionUsd,
  }

  const totalCotizacion = calcularTotalDesgloseBombeo(form.tipoSistema, desglose)

  function actualizar<K extends keyof FormData>(campo: K, valor: FormData[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }))
    }
  }

  function seleccionarCliente(nombre: string) {
    const cliente = clientes.find((item) => item.nombre.toLowerCase() === nombre.trim().toLowerCase())

    setForm((prev) => ({
      ...prev,
      clienteNombre: nombre,
      clienteId: cliente?.id ?? null,
      provincia: prev.tipoSistema === 'electrico'
        ? prev.provincia
        : cliente?.provincia ?? prev.provincia,
    }))
  }

  function cambiarSistema(tipoSistema: TipoSistemaBombeo) {
    setForm((prev) => ({
      ...prev,
      tipoSistema,
      provincia: tipoSistema === 'electrico' ? '' : prev.provincia,
      panelMarca: tipoSistema === 'electrico' ? '' : prev.panelMarca,
      panelModelo: tipoSistema === 'electrico' ? '' : prev.panelModelo,
      panelW: tipoSistema === 'electrico' ? '' : prev.panelW,
      panelCantidad: tipoSistema === 'electrico' ? '' : prev.panelCantidad,
      panelPrecioUnit: tipoSistema === 'electrico' ? '' : prev.panelPrecioUnit,
      vfdMarca: tipoSistema === 'solar_vfd' ? prev.vfdMarca : '',
      vfdModelo: tipoSistema === 'solar_vfd' ? prev.vfdModelo : '',
      vfdKw: tipoSistema === 'solar_vfd' ? prev.vfdKw : '',
      vfdPrecio: tipoSistema === 'solar_vfd' ? prev.vfdPrecio : '',
    }))
  }

  function cambiarTipoBomba(tipoBomba: TipoBomba) {
    setForm((prev) => ({
      ...prev,
      tipoBomba,
      profundidadM: tipoBomba === 'sumergible' ? prev.profundidadM : '',
    }))
  }

  function validarPaso0() {
    const nuevosErrores: Partial<Record<keyof FormData, string>> = {}

    if (!form.clienteNombre.trim()) nuevosErrores.clienteNombre = 'El cliente es requerido'
    if (form.tipoSistema !== 'electrico' && !form.provincia) {
      nuevosErrores.provincia = 'Selecciona una provincia'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  function validarPaso1() {
    const nuevosErrores: Partial<Record<keyof FormData, string>> = {}

    if (form.tipoBomba === 'sumergible' && (!form.profundidadM || Number(form.profundidadM) <= 0)) {
      nuevosErrores.profundidadM = 'Ingresa la profundidad del pozo'
    }
    if (!form.caudalM3h || Number(form.caudalM3h) <= 0) {
      nuevosErrores.caudalM3h = 'Ingresa el caudal requerido'
    }
    if (!form.litrosDiaRequeridos || Number(form.litrosDiaRequeridos) <= 0) {
      nuevosErrores.litrosDiaRequeridos = 'Ingresa los litros por dia'
    }
    if (form.alturaDescargaM === '' || Number(form.alturaDescargaM) < 0) {
      nuevosErrores.alturaDescargaM = 'Ingresa una altura válida'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  function avanzar() {
    if (paso === 0 && !validarPaso0()) return
    if (paso === 1 && !validarPaso1()) return
    setPaso((prev) => Math.min(prev + 1, PASOS.length - 1))
  }

  function retroceder() {
    setPaso((prev) => Math.max(prev - 1, 0))
  }

  function enviar(estado: 'borrador' | 'enviada') {
    if (!esValido || !resultado) {
      setErrorSubmit('Completa los datos técnicos antes de guardar la cotización.')
      return
    }

    if (!form.bombaMarca.trim()) {
      setErrorSubmit('Selecciona o completa la información de la bomba.')
      return
    }

    setEstadoEnvio(estado)
    setErrorSubmit(null)

    startTransition(async () => {
      const response = await crearCotizacionBombeo({
        clienteNombre: form.clienteNombre.trim(),
        clienteId: form.clienteId,
        provincia: form.provincia,
        tipoSistema: form.tipoSistema,
        tipoBomba: form.tipoBomba,
        profundidadM: typeof form.profundidadM === 'number' ? form.profundidadM : null,
        caudalM3h: numeroSeguro(form.caudalM3h),
        litrosDiaRequeridos: numeroSeguro(form.litrosDiaRequeridos),
        alturaDescargaM: numeroSeguro(form.alturaDescargaM),
        bombaMarca: form.bombaMarca.trim(),
        bombaModelo: form.bombaModelo.trim(),
        bombaHp: typeof form.bombaHp === 'number' ? form.bombaHp : resultado.potencia_hp,
        bombaPrecio: numeroSeguro(form.bombaPrecio),
        panelMarca: form.tipoSistema === 'electrico' ? null : (form.panelMarca.trim() || null),
        panelModelo: form.tipoSistema === 'electrico' ? null : (form.panelModelo.trim() || null),
        panelW: form.tipoSistema === 'electrico' ? null : (typeof form.panelW === 'number' ? form.panelW : null),
        panelCantidad: form.tipoSistema === 'electrico'
          ? null
          : (typeof desglose.panelCantidad === 'number' ? desglose.panelCantidad : null),
        panelPrecioUnit: form.tipoSistema === 'electrico'
          ? null
          : (typeof form.panelPrecioUnit === 'number' ? form.panelPrecioUnit : null),
        vfdMarca: form.tipoSistema === 'solar_vfd' ? (form.vfdMarca.trim() || null) : null,
        vfdModelo: form.tipoSistema === 'solar_vfd' ? (form.vfdModelo.trim() || null) : null,
        vfdKw: form.tipoSistema === 'solar_vfd' && typeof form.vfdKw === 'number' ? form.vfdKw : null,
        vfdPrecio: form.tipoSistema === 'solar_vfd' && typeof form.vfdPrecio === 'number' ? form.vfdPrecio : null,
        instalacionUsd: numeroSeguro(form.instalacionUsd),
        totalUsd: totalCotizacion,
        notas: form.notas.trim(),
        estado,
      })

      if (response?.error) {
        setErrorSubmit(response.error)
        toast.error(response.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
        <div className="flex items-center gap-2 flex-wrap">
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
              {index < PASOS.length - 1 && <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />}
            </div>
          ))}
        </div>
      </div>

      {paso === 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
          <h2 className="text-[15px] font-medium text-[var(--text)] mb-1">Tipo y cliente</h2>
          <p className="text-[13px] text-[var(--text-3)] mb-6">
            Define el cliente, el tipo de sistema y la bomba a cotizar.
          </p>

          {clienteInicial && (
            <div className="mb-6 bg-[var(--blue-bg)] border border-[var(--blue)] rounded-[var(--radius-sm)] p-3">
              <p className="text-[13px] text-[var(--blue)] font-medium">
                Cliente prellenado desde CRM
              </p>
              <p className="text-[12px] text-[var(--blue)] mt-1">
                Puedes cambiar el cliente o ajustar la provincia antes de guardar.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Cliente"
                list="clientes-bombeo"
                placeholder="Buscar cliente o escribir uno nuevo"
                value={form.clienteNombre}
                onChange={(e) => seleccionarCliente(e.target.value)}
                error={errores.clienteNombre}
              />
              <datalist id="clientes-bombeo">
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.nombre} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-[var(--text-2)]">Tipo de sistema</label>
              <select
                value={form.tipoSistema}
                onChange={(e) => cambiarSistema(e.target.value as TipoSistemaBombeo)}
                className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                {Object.entries(ETIQUETAS_SISTEMA).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-[var(--text-2)]">Tipo de bomba</label>
              <select
                value={form.tipoBomba}
                onChange={(e) => cambiarTipoBomba(e.target.value as TipoBomba)}
                className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                {Object.entries(ETIQUETAS_BOMBA).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>

            {form.tipoSistema !== 'electrico' && (
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Provincia</label>
                <select
                  value={form.provincia}
                  onChange={(e) => actualizar('provincia', e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  <option value="">Seleccionar provincia</option>
                  {PROVINCIAS_RD.map((provincia) => (
                    <option key={provincia} value={provincia}>{provincia}</option>
                  ))}
                </select>
                {errores.provincia && <p className="text-[11px] text-[var(--red)]">{errores.provincia}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {paso === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div className="space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
              <h2 className="text-[15px] font-medium text-[var(--text)] mb-1">Datos técnicos</h2>
              <p className="text-[13px] text-[var(--text-3)] mb-6">
                Ingresa los datos hidráulicos y revisa el cálculo en tiempo real.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.tipoBomba === 'sumergible' && (
                  <Input
                    label="Profundidad del pozo (m)"
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.profundidadM}
                    onChange={(e) => actualizar('profundidadM', e.target.value === '' ? '' : Number(e.target.value))}
                    error={errores.profundidadM}
                  />
                )}

                <Input
                  label="Caudal requerido (m3/hora)"
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.caudalM3h}
                  onChange={(e) => actualizar('caudalM3h', e.target.value === '' ? '' : Number(e.target.value))}
                  error={errores.caudalM3h}
                />

                <Input
                  label="Litros por dia"
                  type="number"
                  min={0}
                  step="1"
                  value={form.litrosDiaRequeridos}
                  onChange={(e) => actualizar('litrosDiaRequeridos', e.target.value === '' ? '' : Number(e.target.value))}
                  error={errores.litrosDiaRequeridos}
                />

                <Input
                  label="Altura de descarga (m)"
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.alturaDescargaM}
                  onChange={(e) => actualizar('alturaDescargaM', e.target.value === '' ? '' : Number(e.target.value))}
                  error={errores.alturaDescargaM}
                />
              </div>
            </div>

            <SelectorEquipoBombeo
              bombas={bombas}
              paneles={paneles}
              vfds={vfds}
              tipoSistema={form.tipoSistema}
              potenciaHp={resultado?.potencia_hp ?? 0}
              potenciaKw={resultado?.potencia_kw ?? 0}
              kwpNecesario={resultado?.kwp_necesario}
              valores={selectorEquipo}
              onChange={(campo, valor) => actualizar(campo as keyof FormData, valor as FormData[keyof FormData])}
            />
          </div>

          <CalculadoraBombeo
            resultado={resultado}
            litrosDiaRequeridos={numeroSeguro(form.litrosDiaRequeridos)}
            tipoSistema={form.tipoSistema}
            provincia={form.provincia || undefined}
          />
        </div>
      )}

      {paso === 2 && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div className="space-y-4">
            <DesglosePrecio
              tipoSistema={form.tipoSistema}
              valores={desglose}
              bombaDescripcion={form.bombaMarca ? `[${form.bombaMarca} ${form.bombaModelo}]` : undefined}
              panelDescripcion={form.panelMarca ? `[${form.panelMarca} ${form.panelModelo}]` : undefined}
              vfdDescripcion={form.vfdMarca ? `[${form.vfdMarca} ${form.vfdModelo}]` : undefined}
              onChange={(campo, valor) => {
                if (campo === 'bombaPrecio') actualizar('bombaPrecio', valor as FormData['bombaPrecio'])
                if (campo === 'panelPrecioUnit') actualizar('panelPrecioUnit', valor as FormData['panelPrecioUnit'])
                if (campo === 'panelCantidad') actualizar('panelCantidad', valor as FormData['panelCantidad'])
                if (campo === 'vfdPrecio') actualizar('vfdPrecio', valor as FormData['vfdPrecio'])
                if (campo === 'instalacionUsd') actualizar('instalacionUsd', valor as FormData['instalacionUsd'])
              }}
            />

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
              <Textarea
                label="Notas"
                placeholder="Condiciones, observaciones y alcance de instalación..."
                rows={4}
                value={form.notas}
                onChange={(e) => actualizar('notas', e.target.value)}
              />
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 h-fit">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
              Resumen
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Empresa</p>
                <p className="text-[13px] font-medium text-[var(--text)]">{empresaConfig.nombre_empresa}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Cliente</p>
                <p className="text-[13px] font-medium text-[var(--text)]">{form.clienteNombre || 'Sin definir'}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Sistema</p>
                <p className="text-[13px] font-medium text-[var(--text)]">{ETIQUETAS_SISTEMA[form.tipoSistema]}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Bomba</p>
                <p className="text-[13px] font-medium text-[var(--text)]">{ETIQUETAS_BOMBA[form.tipoBomba]}</p>
              </div>
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-[12px] text-[var(--text-3)]">Total USD</p>
                <p className="font-[family-name:var(--font-mono)] text-[24px] font-medium text-[var(--text)] mt-1">
                  {formatearUSD(totalCotizacion)}
                </p>
                <p className="text-[11px] text-[var(--text-3)] mt-1">
                  ITBIS calculado internamente y no visible al cliente.
                </p>
              </div>
              {errorSubmit && (
                <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius-sm)] p-3">
                  <p className="text-[12px] text-[var(--red)]">{errorSubmit}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={retroceder} disabled={paso === 0 || isPending}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Atras
        </Button>

        {paso < PASOS.length - 1 ? (
          <Button variant="accent" onClick={avanzar}>
            Continuar
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              loading={isPending && estadoEnvio === 'borrador'}
              disabled={isPending}
              onClick={() => enviar('borrador')}
            >
              Guardar borrador
            </Button>
            <Button
              variant="accent"
              loading={isPending && estadoEnvio === 'enviada'}
              disabled={isPending}
              onClick={() => enviar('enviada')}
            >
              Guardar y enviar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
