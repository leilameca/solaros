'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ConsumoMensual } from '@/types/cotizaciones'
import { formatearNumero } from '@/lib/calculos'

interface Props {
  datos: ConsumoMensual[]
}

interface TooltipEntry {
  name: string
  value?: number
  fill?: string
}

interface TooltipCustomProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

const NOMBRES_MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

function TooltipPersonalizado({ active, payload, label }: TooltipCustomProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-s)] rounded-[var(--radius-sm)] p-3 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <p className="text-[11px] font-medium text-[var(--text-2)] mb-2 font-[family-name:var(--font-mono)] uppercase tracking-[0.06em]">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: entry.fill }}
          />
          <span className="text-[12px] text-[var(--text-2)]">
            {entry.name === 'consumo_kwh' ? 'Consumo' : 'Generación'}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[12px] font-medium text-[var(--text)] ml-auto pl-3">
            {formatearNumero(entry.value ?? 0, 0)}{' '}
            <span className="text-[var(--text-3)] text-[10px]">KWh</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function GraficoGeneracion({ datos }: Props) {
  const datosGrafico = datos
    .sort((a, b) => a.mes - b.mes)
    .map((d) => ({
      mes: NOMBRES_MESES[d.mes - 1],
      consumo_kwh: d.consumo_kwh,
      generacion_kwh: d.generacion_kwh,
    }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={datosGrafico}
        margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
        barCategoryGap="28%"
        barGap={2}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(0,0,0,0.06)"
        />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${formatearNumero(v, 0)}`}
          width={55}
        />
        <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Legend
          iconType="circle"
          iconSize={7}
          formatter={(value) =>
            value === 'consumo_kwh' ? 'Consumo' : 'Generación'
          }
          wrapperStyle={{
            fontSize: '12px',
            color: 'var(--text-2)',
            paddingTop: '12px',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <Bar
          dataKey="consumo_kwh"
          name="consumo_kwh"
          fill="#1B5FA8"
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="generacion_kwh"
          name="generacion_kwh"
          fill="#1A7A4A"
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
