'use client'

import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { calcularCantidadPanelesBombeo } from '@/components/bombeo/CalculadoraBombeo'
import type { ItemInventarioBombeo, TipoSistemaBombeo } from '@/types/bombeo'

export interface SelectorEquipoValores {
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
}

function sugerirPorPotencia(items: ItemInventarioBombeo[], potenciaKw: number) {
  const ordenados = [...items].sort((a, b) => (a.potencia_kw ?? 0) - (b.potencia_kw ?? 0))
  return ordenados.find((item) => (item.potencia_kw ?? 0) >= potenciaKw) ?? ordenados[0]
}

export function SelectorEquipoBombeo({
  bombas,
  paneles,
  vfds,
  tipoSistema,
  potenciaHp,
  potenciaKw,
  kwpNecesario,
  valores,
  onChange,
}: {
  bombas: ItemInventarioBombeo[]
  paneles: ItemInventarioBombeo[]
  vfds: ItemInventarioBombeo[]
  tipoSistema: TipoSistemaBombeo
  potenciaHp: number
  potenciaKw: number
  kwpNecesario?: number
  valores: SelectorEquipoValores
  onChange: <K extends keyof SelectorEquipoValores>(campo: K, valor: SelectorEquipoValores[K]) => void
}) {
  const bombaSugerida = sugerirPorPotencia(bombas, potenciaKw)
  const panelSugerido = paneles[0]
  const vfdSugerido = sugerirPorPotencia(vfds, potenciaKw)
  const panelCantidadSugerida = calcularCantidadPanelesBombeo(
    kwpNecesario,
    typeof valores.panelW === 'number' ? valores.panelW : panelSugerido?.potencia_w
  )

  return (
    <div className="space-y-6">
      <Seccion
        titulo="Bomba"
        descripcion={`Potencia minima recomendada: ${potenciaHp.toFixed(1)} HP / ${potenciaKw.toFixed(2)} kW`}
      >
        {bombas.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {bombas.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange('bombaMarca', item.marca)
                  onChange('bombaModelo', item.modelo)
                  onChange('bombaHp', item.potencia_kw ? Number((item.potencia_kw / 0.746).toFixed(1)) : potenciaHp)
                  onChange('bombaPrecio', item.precio_unitario ?? '')
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-sm bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue)] hover:border-[var(--blue)] transition-colors"
              >
                {item.marca} {item.modelo}
              </button>
            ))}
            {bombaSugerida && (
              <button
                type="button"
                onClick={() => {
                  onChange('bombaMarca', bombaSugerida.marca)
                  onChange('bombaModelo', bombaSugerida.modelo)
                  onChange('bombaHp', bombaSugerida.potencia_kw ? Number((bombaSugerida.potencia_kw / 0.746).toFixed(1)) : potenciaHp)
                  onChange('bombaPrecio', bombaSugerida.precio_unitario ?? '')
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-sm bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-bd)]"
              >
                Sugerida
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Marca" value={valores.bombaMarca} onChange={(e) => onChange('bombaMarca', e.target.value)} />
          <Input label="Modelo" value={valores.bombaModelo} onChange={(e) => onChange('bombaModelo', e.target.value)} />
          <Input
            label="Potencia (HP)"
            type="number"
            step="0.1"
            value={valores.bombaHp}
            onChange={(e) => onChange('bombaHp', e.target.value === '' ? '' : Number(e.target.value))}
          />
          <Input
            label="Precio USD"
            type="number"
            step="0.01"
            value={valores.bombaPrecio}
            onChange={(e) => onChange('bombaPrecio', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      </Seccion>

      {tipoSistema !== 'electrico' && (
        <Seccion
          titulo="Paneles"
          descripcion={`Cantidad sugerida: ${panelCantidadSugerida || 0} paneles`}
        >
          {paneles.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {paneles.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange('panelMarca', item.marca)
                    onChange('panelModelo', item.modelo)
                    onChange('panelW', item.potencia_w ?? '')
                    onChange('panelPrecioUnit', item.precio_unitario ?? '')
                    onChange('panelCantidad', calcularCantidadPanelesBombeo(kwpNecesario, item.potencia_w))
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-sm bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue)] hover:border-[var(--blue)] transition-colors"
                >
                  {item.marca} {item.modelo}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Marca" value={valores.panelMarca} onChange={(e) => onChange('panelMarca', e.target.value)} />
            <Input label="Modelo" value={valores.panelModelo} onChange={(e) => onChange('panelModelo', e.target.value)} />
            <Input
              label="Potencia (W)"
              type="number"
              step="1"
              value={valores.panelW}
              onChange={(e) => onChange('panelW', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Cantidad"
              type="number"
              step="1"
              value={valores.panelCantidad}
              hint={panelCantidadSugerida > 0 ? `Sugerido: ${panelCantidadSugerida}` : undefined}
              onChange={(e) => onChange('panelCantidad', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <div className="sm:col-span-2">
              <Input
                label="Precio unitario USD"
                type="number"
                step="0.01"
                value={valores.panelPrecioUnit}
                onChange={(e) => onChange('panelPrecioUnit', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
        </Seccion>
      )}

      {tipoSistema === 'solar_vfd' && (
        <Seccion
          titulo="VFD"
          descripcion={`El variador debe cubrir al menos ${potenciaKw.toFixed(2)} kW`}
        >
          {vfds.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {vfds.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange('vfdMarca', item.marca)
                    onChange('vfdModelo', item.modelo)
                    onChange('vfdKw', item.potencia_kw ?? '')
                    onChange('vfdPrecio', item.precio_unitario ?? '')
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-sm bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue)] hover:border-[var(--blue)] transition-colors"
                >
                  {item.marca} {item.modelo}
                </button>
              ))}
              {vfdSugerido && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('vfdMarca', vfdSugerido.marca)
                    onChange('vfdModelo', vfdSugerido.modelo)
                    onChange('vfdKw', vfdSugerido.potencia_kw ?? potenciaKw)
                    onChange('vfdPrecio', vfdSugerido.precio_unitario ?? '')
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-sm bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-bd)]"
                >
                  Sugerido
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Marca" value={valores.vfdMarca} onChange={(e) => onChange('vfdMarca', e.target.value)} />
            <Input label="Modelo" value={valores.vfdModelo} onChange={(e) => onChange('vfdModelo', e.target.value)} />
            <Input
              label="Potencia (kW)"
              type="number"
              step="0.1"
              value={valores.vfdKw}
              onChange={(e) => onChange('vfdKw', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Precio USD"
              type="number"
              step="0.01"
              value={valores.vfdPrecio}
              onChange={(e) => onChange('vfdPrecio', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </Seccion>
      )}
    </div>
  )
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion: string
  children: ReactNode
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-1">
        {titulo}
      </p>
      <p className="text-[12px] text-[var(--text-3)] mb-4">{descripcion}</p>
      {children}
    </div>
  )
}
