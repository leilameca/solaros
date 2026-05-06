'use client'

import { FileDown, Download, Loader2, RotateCcw, MessageCircle } from 'lucide-react'
import { useGenerarPDF } from '@/hooks/useGenerarPDF'
import { GraficoPDFCaptura } from './GraficoPDFCaptura'
import type { DatosPropuestaSolar, DatosPropuestaBombeo, DatosPropuestaElectrico } from '@/types/pdf'

type Props =
  | {
      tipo: 'solar'
      datos: Omit<DatosPropuestaSolar, 'imagenGrafico'>
      empresaId: string
    }
  | {
      tipo: 'bombeo'
      datos: DatosPropuestaBombeo
      empresaId: string
    }
  | {
      tipo: 'electrico'
      datos: DatosPropuestaElectrico
      empresaId: string
    }

export function BotonGenerarPDF(props: Props) {
  const {
    estado,
    mensajeError,
    generarSolar,
    generarBombeo,
    generarElectrico,
    descargar,
    compartirWhatsapp,
    limpiar,
  } = useGenerarPDF()

  const numeroCotizacion =
    props.tipo === 'solar'
      ? props.datos.cotizacion.numero_cotizacion
      : props.tipo === 'bombeo'
      ? props.datos.cotizacion.numero_cotizacion
      : props.datos.cotizacion.numero_cotizacion

  const handleGenerar = async () => {
    if (props.tipo === 'solar') {
      await generarSolar(props.datos)
    } else if (props.tipo === 'bombeo') {
      await generarBombeo(props.datos)
    } else {
      await generarElectrico(props.datos)
    }
  }

  const handleDescargar = () => {
    descargar(`${numeroCotizacion}.pdf`)
  }

  const handleWhatsapp = () => {
    compartirWhatsapp(props.empresaId, numeroCotizacion)
  }

  return (
    <>
      {/* Gráfico oculto para captura (solo solar con datos mensuales) */}
      {props.tipo === 'solar' && props.datos.consumoMensual.length > 0 && (
        <GraficoPDFCaptura
          datos={props.datos.consumoMensual}
          cotizacionId={props.datos.cotizacion.id}
        />
      )}

      {/* Estado: idle */}
      {estado === 'idle' && (
        <button
          onClick={handleGenerar}
          className="flex items-center gap-1.5 bg-transparent text-[var(--text)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium hover:bg-[var(--surface-2)] transition-colors"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PDF</span>
        </button>
      )}

      {/* Estado: generando */}
      {estado === 'generando' && (
        <button
          disabled
          className="flex items-center gap-1.5 bg-transparent text-[var(--text-2)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] cursor-not-allowed"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="hidden sm:inline text-[12px]">Preparando...</span>
        </button>
      )}

      {/* Estado: listo */}
      {estado === 'listo' && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDescargar}
            className="flex items-center gap-1.5 bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </button>
          <button
            onClick={handleWhatsapp}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button
            onClick={limpiar}
            title="Generar de nuevo"
            className="flex items-center justify-center h-[30px] w-[30px] border border-[var(--border-s)] rounded-[var(--radius-sm)] text-[var(--text-3)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Estado: error */}
      {estado === 'error' && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--red)]">
            {mensajeError ?? 'Error al generar'}
          </span>
          <button
            onClick={limpiar}
            className="flex items-center gap-1 text-[12px] text-[var(--text-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-2 py-1 hover:bg-[var(--surface-2)] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      )}
    </>
  )
}
