'use client'

import { Input } from '@/components/ui/input'
import { formatearUSD } from '@/lib/calculos'
import type { DesglosePrecioBombeo, TipoSistemaBombeo } from '@/types/bombeo'

function numeroSeguro(valor: number | '') {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : 0
}

export function calcularTotalDesgloseBombeo(
  tipoSistema: TipoSistemaBombeo,
  desglose: DesglosePrecioBombeo
) {
  const paneles = tipoSistema === 'electrico'
    ? 0
    : numeroSeguro(desglose.panelPrecioUnit) * numeroSeguro(desglose.panelCantidad)
  const vfd = tipoSistema === 'solar_vfd' ? numeroSeguro(desglose.vfdPrecio) : 0

  return numeroSeguro(desglose.bombaPrecio) + paneles + vfd + numeroSeguro(desglose.instalacionUsd)
}

export function DesglosePrecio({
  tipoSistema,
  valores,
  onChange,
  soloLectura,
  bombaDescripcion,
  panelDescripcion,
  vfdDescripcion,
}: {
  tipoSistema: TipoSistemaBombeo
  valores: DesglosePrecioBombeo
  onChange?: <K extends keyof DesglosePrecioBombeo>(campo: K, valor: DesglosePrecioBombeo[K]) => void
  soloLectura?: boolean
  bombaDescripcion?: string
  panelDescripcion?: string
  vfdDescripcion?: string
}) {
  const total = calcularTotalDesgloseBombeo(tipoSistema, valores)
  const panelSubtotal = numeroSeguro(valores.panelPrecioUnit) * numeroSeguro(valores.panelCantidad)

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Desglose de precio
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">Componente</th>
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">Cantidad</th>
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">Precio unit.</th>
              <th className="px-4 py-2 text-right text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            <tr>
              <td className="px-4 py-3 text-[13px] text-[var(--text)]">Bomba {bombaDescripcion ?? ''}</td>
              <td className="px-4 py-3 text-[13px] text-[var(--text-2)]">1</td>
              <td className="px-4 py-3">
                <CeldaEditable
                  soloLectura={soloLectura}
                  value={numeroSeguro(valores.bombaPrecio)}
                  onChange={(value) => onChange?.('bombaPrecio', value)}
                />
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                {formatearUSD(numeroSeguro(valores.bombaPrecio))}
              </td>
            </tr>

            {tipoSistema !== 'electrico' && (
              <tr>
                <td className="px-4 py-3 text-[13px] text-[var(--text)]">Paneles {panelDescripcion ?? ''}</td>
                <td className="px-4 py-3">
                  {soloLectura ? (
                    <span className="text-[13px] text-[var(--text-2)]">{numeroSeguro(valores.panelCantidad)}</span>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      value={valores.panelCantidad}
                      onChange={(e) => onChange?.('panelCantidad', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  <CeldaEditable
                    soloLectura={soloLectura}
                    value={numeroSeguro(valores.panelPrecioUnit)}
                    onChange={(value) => onChange?.('panelPrecioUnit', value)}
                  />
                </td>
                <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                  {formatearUSD(panelSubtotal)}
                </td>
              </tr>
            )}

            {tipoSistema === 'solar_vfd' && (
              <tr>
                <td className="px-4 py-3 text-[13px] text-[var(--text)]">VFD {vfdDescripcion ?? ''}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-2)]">1</td>
                <td className="px-4 py-3">
                  <CeldaEditable
                    soloLectura={soloLectura}
                    value={numeroSeguro(valores.vfdPrecio)}
                    onChange={(value) => onChange?.('vfdPrecio', value)}
                  />
                </td>
                <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                  {formatearUSD(numeroSeguro(valores.vfdPrecio))}
                </td>
              </tr>
            )}

            <tr>
              <td className="px-4 py-3 text-[13px] text-[var(--text)]">Instalacion y mano de obra</td>
              <td className="px-4 py-3 text-[13px] text-[var(--text-2)]">-</td>
              <td className="px-4 py-3">
                <CeldaEditable
                  soloLectura={soloLectura}
                  value={numeroSeguro(valores.instalacionUsd)}
                  onChange={(value) => onChange?.('instalacionUsd', value)}
                />
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
                {formatearUSD(numeroSeguro(valores.instalacionUsd))}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="px-4 py-4 text-[13px] font-medium text-[var(--text)]">Total USD</td>
              <td />
              <td />
              <td className="px-4 py-4 text-right font-[family-name:var(--font-mono)] text-[15px] font-medium text-[var(--text)]">
                {formatearUSD(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function CeldaEditable({
  value,
  onChange,
  soloLectura,
}: {
  value: number
  onChange?: (value: number) => void
  soloLectura?: boolean
}) {
  if (soloLectura) {
    return (
      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--text)]">
        {formatearUSD(value)}
      </span>
    )
  }

  return (
    <Input
      type="number"
      min={0}
      step="0.01"
      value={value}
      onChange={(e) => onChange?.(e.target.value === '' ? 0 : Number(e.target.value))}
    />
  )
}
