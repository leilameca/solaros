'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import type { ConsumoMensual } from '@/types/cotizaciones'

interface Props {
  datos: ConsumoMensual[]
  cotizacionId: string
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export function GraficoPDFCaptura({ datos, cotizacionId }: Props) {
  const datosGrafico = [...datos]
    .sort((a, b) => a.mes - b.mes)
    .map((d) => ({
      mes: MESES[d.mes - 1],
      consumo: d.consumo_kwh,
      generacion: d.generacion_kwh,
    }))

  return (
    <div
      id={`grafico-pdf-${cotizacionId}`}
      style={{
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none',
        width: '700px',
        height: '320px',
        background: '#FAFAF8',
        padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      aria-hidden="true"
    >
      <ResponsiveContainer width={676} height={296}>
        <BarChart
          data={datosGrafico}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.07)" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: '#9C9C96', fontFamily: 'system-ui' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9C9C96', fontFamily: 'system-ui' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Bar
            dataKey="consumo"
            fill="#1B5FA8"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
          <Bar
            dataKey="generacion"
            fill="#1A7A4A"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
