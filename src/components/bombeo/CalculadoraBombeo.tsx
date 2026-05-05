'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatearNumero } from '@/lib/calculos'
import type { DatosBombeo, ResultadoCalculoBombeo, TipoSistemaBombeo } from '@/types/bombeo'

export const HORAS_BOMBEO_SOLAR = 6

export const HORAS_SOL_BOMBEO: Record<string, number> = {
  Santiago: 4.11,
  'La Vega': 4.11,
  Duarte: 4.11,
  Espaillat: 4.11,
  'Hermanas Mirabal': 4.11,
  'Maria Trinidad Sanchez': 4.11,
  Samana: 4.11,
  'Sanchez Ramirez': 4.11,
  'Puerto Plata': 4.11,
  'Monsenor Nouel': 4.11,
  'San Francisco de Macoris': 4.11,
  Bonao: 4.11,
  Salcedo: 4.11,
  Nagua: 4.11,
  Cotui: 4.11,
  Moca: 4.11,
  'Santiago Rodriguez': 4.23,
  Valverde: 4.23,
  Dajabon: 4.23,
  'Monte Cristi': 4.23,
  Montecristi: 4.23,
  Mao: 4.23,
  'Villa Vasquez': 4.23,
  'Distrito Nacional': 4.0,
  'Santo Domingo': 4.0,
  Constanza: 3.97,
  Jarabacoa: 3.97,
}

function numeroSeguro(valor: number | undefined) {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : 0
}

export function obtenerHorasSolBombeo(provincia?: string) {
  if (!provincia) return 4
  return HORAS_SOL_BOMBEO[provincia] ?? 4
}

export function calcularSistemaBombeo(datos: DatosBombeo): ResultadoCalculoBombeo {
  const profundidad = numeroSeguro(datos.profundidad_m)
  const altura_total = profundidad + numeroSeguro(datos.altura_descarga_m)
  const potencia_hp_raw = (numeroSeguro(datos.caudal_m3h) * altura_total) / (270 * 0.75)
  const potencia_hp = Math.ceil(potencia_hp_raw * 2) / 2
  const potencia_kw = potencia_hp * 0.746

  const litros_disponibles = numeroSeguro(datos.caudal_m3h) * 1000 * HORAS_BOMBEO_SOLAR
  const cubre_requerimiento = litros_disponibles >= numeroSeguro(datos.litros_dia_requeridos)
  const deficit_litros = cubre_requerimiento
    ? 0
    : numeroSeguro(datos.litros_dia_requeridos) - litros_disponibles

  let kwp_necesario: number | undefined
  if (datos.tipo_sistema !== 'electrico' && datos.provincia) {
    const factor_perdida = 0.85
    kwp_necesario = potencia_kw / factor_perdida
  }

  return {
    potencia_hp,
    potencia_kw,
    litros_disponibles,
    cubre_requerimiento,
    deficit_litros,
    kwp_necesario,
  }
}

export function calcularCantidadPanelesBombeo(
  kwpNecesario: number | undefined,
  panelW: number | null | undefined
) {
  if (!kwpNecesario || !panelW || panelW <= 0) return 0
  return Math.ceil((kwpNecesario * 1000) / panelW)
}

export function useCalculoBombeo(input: Partial<DatosBombeo>) {
  const { tipo_sistema, tipo_bomba, caudal_m3h, litros_dia_requeridos, altura_descarga_m } = input

  const resultado = useMemo<ResultadoCalculoBombeo | null>(() => {
    if (!tipo_sistema || !tipo_bomba) return null
    if (!caudal_m3h || !litros_dia_requeridos) return null
    if (caudal_m3h <= 0 || litros_dia_requeridos <= 0) return null
    if (typeof altura_descarga_m !== 'number' || altura_descarga_m < 0) return null
    if (tipo_bomba === 'sumergible' && (typeof input.profundidad_m !== 'number' || input.profundidad_m <= 0)) {
      return null
    }

    return calcularSistemaBombeo({
      tipo_sistema,
      tipo_bomba,
      provincia: input.provincia,
      profundidad_m: input.profundidad_m,
      caudal_m3h,
      litros_dia_requeridos,
      altura_descarga_m,
    })
  }, [tipo_sistema, tipo_bomba, input.provincia, input.profundidad_m, caudal_m3h, litros_dia_requeridos, altura_descarga_m])

  return {
    resultado,
    esValido: resultado !== null,
    horasSolProvincia: obtenerHorasSolBombeo(input.provincia),
  }
}

export function CalculadoraBombeo({
  resultado,
  litrosDiaRequeridos,
  tipoSistema,
  provincia,
}: {
  resultado: ResultadoCalculoBombeo | null
  litrosDiaRequeridos: number
  tipoSistema: TipoSistemaBombeo
  provincia?: string
}) {
  if (!resultado) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
            Calculo automatico
          </p>
          <p className="text-[13px] text-[var(--text-3)]">
            Completa los datos tecnicos para ver la recomendacion del sistema.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-3">
            Calculo automatico
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Potencia bomba" value={formatearNumero(resultado.potencia_hp, 1)} unit="HP" />
            <Metric label="Potencia electrica" value={formatearNumero(resultado.potencia_kw, 2)} unit="kW" />
            <Metric label="Litros por dia" value={formatearNumero(resultado.litros_disponibles, 0)} unit="L/dia" />
            <Metric
              label={tipoSistema === 'electrico' ? 'Paneles' : 'KWp requerido'}
              value={
                tipoSistema === 'electrico' || typeof resultado.kwp_necesario !== 'number'
                  ? 'No aplica'
                  : formatearNumero(resultado.kwp_necesario, 2)
              }
              unit={tipoSistema === 'electrico' || typeof resultado.kwp_necesario !== 'number' ? '' : 'KWp'}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-[11px] text-[var(--text-3)]">
          <span>Horas bombeo solar: {HORAS_BOMBEO_SOLAR} h/dia</span>
          {provincia ? (
            <span>Horas sol ref. {provincia}: {formatearNumero(obtenerHorasSolBombeo(provincia), 2)} h</span>
          ) : null}
        </div>

        {!resultado.cubre_requerimiento && (
          <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius-sm)] p-3">
            <p className="text-[13px] text-[var(--red)] font-medium">
              Caudal insuficiente
            </p>
            <p className="text-[12px] text-[var(--red)] mt-1">
              El sistema genera {resultado.litros_disponibles.toLocaleString()} L/dia pero el cliente
              requiere {litrosDiaRequeridos.toLocaleString()} L/dia. Deficit de{' '}
              {resultado.deficit_litros.toLocaleString()} L/dia.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
      <p className="text-[11px] text-[var(--text-3)] mb-1">{label}</p>
      <p className="font-[family-name:var(--font-mono)] text-[15px] font-medium text-[var(--text)]">
        {value}
        {unit ? <span className="text-[var(--text-3)] text-[10px] ml-1">{unit}</span> : null}
      </p>
    </div>
  )
}
