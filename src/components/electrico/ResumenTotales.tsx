'use client'

import type { TotalesElectrico } from '@/types/electrico'
import { formatearRD2 } from '@/lib/calculos-electrico'

interface Props {
  totales: TotalesElectrico
  manoObraRd: number
  tasaDolar: number
}

export function ResumenTotales({ totales, manoObraRd, tasaDolar }: Props) {
  const { subtotal_materiales_rd, itbis_rd, total_rd, total_usd } = totales

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Resumen de totales
        </p>
      </div>

      <div className="p-4 space-y-2">
        <FilaResumen
          label="Subtotal materiales"
          valor={`RD$ ${formatearRD2(subtotal_materiales_rd)}`}
        />
        <FilaResumen
          label="ITBIS 18% (sobre materiales)"
          valor={`RD$ ${formatearRD2(itbis_rd)}`}
          dimmed
        />
        <FilaResumen
          label="Mano de obra"
          valor={`RD$ ${formatearRD2(manoObraRd)}`}
        />

        <div className="border-t border-[var(--border)] pt-2 mt-2 space-y-2">
          <FilaResumen
            label="Total RD$"
            valor={`RD$ ${formatearRD2(total_rd)}`}
            grande
          />
          <FilaResumen
            label={`Total USD (tasa ${tasaDolar})`}
            valor={`$ ${(total_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            acento
          />
        </div>
      </div>
    </div>
  )
}

function FilaResumen({
  label,
  valor,
  grande,
  dimmed,
  acento,
}: {
  label: string
  valor: string
  grande?: boolean
  dimmed?: boolean
  acento?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`text-[12px] ${
          dimmed ? 'text-[var(--text-3)]' : 'text-[var(--text-2)]'
        }`}
      >
        {label}
      </span>
      <span
        className={`font-[family-name:var(--font-mono)] text-right ${
          grande
            ? 'text-[15px] font-medium text-[var(--text)]'
            : acento
            ? 'text-[14px] font-medium text-[var(--accent)]'
            : dimmed
            ? 'text-[13px] text-[var(--text-3)]'
            : 'text-[13px] text-[var(--text)]'
        }`}
      >
        {valor}
      </span>
    </div>
  )
}
