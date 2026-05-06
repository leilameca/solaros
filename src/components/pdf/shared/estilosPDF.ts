'use client'

import { StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-400-normal.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-500-normal.woff2',
      fontWeight: 500,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-300-normal.woff2',
      fontWeight: 300,
    },
  ],
})

// Hyphenation desactivado para español
Font.registerHyphenationCallback((word) => [word])

export const C = {
  texto: '#1A1A18',
  texto2: '#5C5C58',
  texto3: '#9C9C96',
  acento: '#C8860A',
  acentoBg: '#FDF3DC',
  acentoBorde: '#E8C56A',
  verde: '#1A7A4A',
  verdeBg: '#EDFAF3',
  verdeBorde: '#B8E8CC',
  azul: '#1B5FA8',
  azulBg: '#EAF2FD',
  rojo: '#B83232',
  rojoBg: '#FDECEC',
  borde: '#E8E8E4',
  borde2: '#D4D4CE',
  fondo: '#FAFAF8',
  superficie: '#FFFFFF',
  superficie2: '#F5F4F0',
  headerBg: '#1A1A18',
} as const

export const s = StyleSheet.create({
  // Página
  pagina: {
    fontFamily: 'Inter',
    backgroundColor: C.fondo,
    paddingBottom: 48,
    fontSize: 10,
    color: C.texto,
  },

  // Header oscuro
  header: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 40,
    paddingVertical: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIzq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
    objectFit: 'contain',
  },
  headerLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: C.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNombre: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 500,
  },
  headerContacto: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 8,
    marginTop: 2,
  },
  headerDer: {
    alignItems: 'flex-end',
  },
  headerNumeroLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerNumero: {
    color: C.acento,
    fontSize: 15,
    fontWeight: 500,
  },

  // Contenido
  body: {
    paddingHorizontal: 40,
    paddingTop: 22,
  },

  // Sección
  seccion: {
    marginBottom: 14,
  },
  seccionTitulo: {
    fontSize: 7,
    fontWeight: 500,
    color: C.texto3,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  // Tarjetas
  tarjeta: {
    backgroundColor: C.superficie,
    borderWidth: 1,
    borderColor: C.borde,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  tarjetaVerde: {
    backgroundColor: C.verdeBg,
    borderWidth: 1,
    borderColor: C.verdeBorde,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  tarjetaAcento: {
    backgroundColor: C.acentoBg,
    borderWidth: 1,
    borderColor: C.acentoBorde,
    borderRadius: 8,
    padding: 10,
  },

  // Grid de métricas
  grid2: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  grid4: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metrica: {
    flex: 1,
    backgroundColor: C.superficie,
    borderWidth: 1,
    borderColor: C.borde,
    borderRadius: 8,
    padding: 10,
  },
  metricaDestaca: {
    flex: 1,
    backgroundColor: C.acentoBg,
    borderWidth: 1,
    borderColor: C.acentoBorde,
    borderRadius: 8,
    padding: 10,
  },
  metricaLabel: {
    fontSize: 7,
    fontWeight: 500,
    color: C.texto3,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricaValor: {
    fontSize: 12,
    fontWeight: 500,
    color: C.texto,
  },
  metricaValorAcento: {
    fontSize: 12,
    fontWeight: 500,
    color: C.acento,
  },
  metricaValorVerde: {
    fontSize: 12,
    fontWeight: 500,
    color: C.verde,
  },
  metricaSub: {
    fontSize: 8,
    color: C.texto3,
    marginTop: 2,
  },

  // Fila dato label/valor
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.borde,
  },
  filaLabel: {
    fontSize: 9,
    color: C.texto3,
  },
  filaValor: {
    fontSize: 9,
    fontWeight: 500,
    color: C.texto,
  },
  filaValorAcento: {
    fontSize: 9,
    fontWeight: 500,
    color: C.acento,
  },
  filaValorVerde: {
    fontSize: 9,
    fontWeight: 500,
    color: C.verde,
  },

  // Tabla
  tablaWrap: {
    borderWidth: 1,
    borderColor: C.borde,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tablaHeader: {
    flexDirection: 'row',
    backgroundColor: C.superficie2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.borde,
  },
  tablaFila: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.borde,
  },
  tablaFilaAlterna: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.fondo,
    borderBottomWidth: 1,
    borderBottomColor: C.borde,
  },
  tablaFooter: {
    flexDirection: 'row',
    backgroundColor: C.superficie2,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tablaColTxt: {
    fontSize: 7,
    fontWeight: 500,
    color: C.texto3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tablaCelda: {
    fontSize: 9,
    color: C.texto,
  },
  tablaCeldaMono: {
    fontSize: 9,
    color: C.texto,
    fontWeight: 500,
  },
  tablaCeldaLabel: {
    fontSize: 9,
    color: C.texto3,
  },

  // Separador
  sep: {
    height: 1,
    backgroundColor: C.borde,
    marginVertical: 8,
  },

  // Subtítulo de sección interno
  subtitulo: {
    fontSize: 8,
    fontWeight: 500,
    color: C.texto3,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },

  // Footer de página
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.borde,
    paddingTop: 6,
  },
  footerTxt: {
    fontSize: 7,
    color: C.texto3,
  },
  footerTxtAcento: {
    fontSize: 7,
    color: C.acento,
  },
})

// Formateadores sin Intl para mayor compatibilidad dentro del renderer
export function usd(valor: number): string {
  return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
export function rd(valor: number): string {
  return `RD$ ${valor.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
export function num(valor: number, dec = 2): string {
  return valor.toLocaleString('es-DO', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
