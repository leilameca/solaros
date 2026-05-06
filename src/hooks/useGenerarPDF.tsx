'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DatosPropuestaSolar, DatosPropuestaBombeo, DatosPropuestaElectrico } from '@/types/pdf'

export type EstadoPDF = 'idle' | 'generando' | 'listo' | 'error'

async function capturarGrafico(cotizacionId: string): Promise<string | undefined> {
  try {
    const elemento = document.getElementById(`grafico-pdf-${cotizacionId}`)
    if (!elemento) return undefined

    // Pequeña pausa para asegurar que Recharts terminó de renderizar
    await new Promise((r) => setTimeout(r, 150))

    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(elemento, {
      backgroundColor: '#FAFAF8',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    return canvas.toDataURL('image/png')
  } catch {
    return undefined
  }
}

export function useGenerarPDF() {
  const [estado, setEstado] = useState<EstadoPDF>('idle')
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const limpiar = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    blobRef.current = null
    setEstado('idle')
    setMensajeError(null)
  }, [])

  const guardarBlob = useCallback((blob: Blob) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    blobRef.current = blob
    blobUrlRef.current = URL.createObjectURL(blob)
  }, [])

  // ─── Solar ────────────────────────────────────────────────────────────────
  const generarSolar = useCallback(
    async (datos: Omit<DatosPropuestaSolar, 'imagenGrafico'>): Promise<void> => {
      setEstado('generando')
      setMensajeError(null)
      try {
        const imagenGrafico = datos.consumoMensual.length > 0
          ? await capturarGrafico(datos.cotizacion.id)
          : undefined

        const [{ pdf }, { PropuestaSolarPDF }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/pdf/PropuestaSolarPDF'),
        ])

        const elemento = <PropuestaSolarPDF datos={{ ...datos, imagenGrafico }} />
        const blob = await pdf(elemento).toBlob()
        guardarBlob(blob)
        setEstado('listo')
      } catch (err) {
        console.error('Error generando PDF solar:', err)
        setMensajeError('No se pudo generar el PDF. Intenta de nuevo.')
        setEstado('error')
      }
    },
    [guardarBlob]
  )

  // ─── Bombeo ───────────────────────────────────────────────────────────────
  const generarBombeo = useCallback(
    async (datos: DatosPropuestaBombeo): Promise<void> => {
      setEstado('generando')
      setMensajeError(null)
      try {
        const [{ pdf }, { PropuestaBombeoPDF }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/pdf/PropuestaBombeoPDF'),
        ])

        const elemento = <PropuestaBombeoPDF datos={datos} />
        const blob = await pdf(elemento).toBlob()
        guardarBlob(blob)
        setEstado('listo')
      } catch (err) {
        console.error('Error generando PDF bombeo:', err)
        setMensajeError('No se pudo generar el PDF. Intenta de nuevo.')
        setEstado('error')
      }
    },
    [guardarBlob]
  )

  // ─── Eléctrico ────────────────────────────────────────────────────────────
  const generarElectrico = useCallback(
    async (datos: DatosPropuestaElectrico): Promise<void> => {
      setEstado('generando')
      setMensajeError(null)
      try {
        const [{ pdf }, { PropuestaElectricoPDF }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/pdf/PropuestaElectricoPDF'),
        ])

        const elemento = <PropuestaElectricoPDF datos={datos} />
        const blob = await pdf(elemento).toBlob()
        guardarBlob(blob)
        setEstado('listo')
      } catch (err) {
        console.error('Error generando PDF eléctrico:', err)
        setMensajeError('No se pudo generar el PDF. Intenta de nuevo.')
        setEstado('error')
      }
    },
    [guardarBlob]
  )

  // ─── Descargar ────────────────────────────────────────────────────────────
  const descargar = useCallback((nombreArchivo: string) => {
    if (!blobUrlRef.current) return
    const a = document.createElement('a')
    a.href = blobUrlRef.current
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  // ─── Compartir por WhatsApp ───────────────────────────────────────────────
  const compartirWhatsapp = useCallback(
    async (empresaId: string, numeroCotizacion: string): Promise<void> => {
      if (!blobRef.current) return
      try {
        const supabase = createClient()
        const nombreArchivo = `${numeroCotizacion}.pdf`
        const ruta = `${empresaId}/${nombreArchivo}`

        const { data, error } = await supabase.storage
          .from('propuestas')
          .upload(ruta, blobRef.current, {
            contentType: 'application/pdf',
            upsert: true,
          })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('propuestas')
          .getPublicUrl(data.path)

        const urlPublica = urlData.publicUrl
        const mensaje = encodeURIComponent(
          `Propuesta ${numeroCotizacion}: ${urlPublica}`
        )
        window.open(`https://wa.me/?text=${mensaje}`, '_blank')
      } catch (err) {
        console.error('Error al subir PDF a Storage:', err)
        alert('No se pudo subir el PDF para compartir. Intenta descargar y enviar manualmente.')
      }
    },
    []
  )

  return {
    estado,
    mensajeError,
    generarSolar,
    generarBombeo,
    generarElectrico,
    descargar,
    compartirWhatsapp,
    limpiar,
  }
}
