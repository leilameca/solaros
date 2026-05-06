'use client'

import { Document, Page, View, Text } from '@react-pdf/renderer'
import { s, C, usd, num } from './shared/estilosPDF'
import { HeaderEmpresaPDF } from './shared/HeaderEmpresaPDF'
import type { DatosPropuestaBombeo } from '@/types/pdf'

const ETIQUETAS_SISTEMA: Record<string, string> = {
  solar_directo: 'Solar directo',
  solar_vfd: 'Solar con VFD',
  electrico: 'Eléctrico',
}
const ETIQUETAS_BOMBA: Record<string, string> = {
  sumergible: 'Sumergible',
  superficial: 'Superficial',
}

interface Props {
  datos: DatosPropuestaBombeo
}

function FilaDato({ label, valor, colorValor }: { label: string; valor: string; colorValor?: string }) {
  return (
    <View style={s.fila}>
      <Text style={s.filaLabel}>{label}</Text>
      <Text style={[s.filaValor, colorValor ? { color: colorValor } : {}]}>{valor}</Text>
    </View>
  )
}

function Metrica({ label, valor, sub, destaca }: { label: string; valor: string; sub?: string; destaca?: boolean }) {
  return (
    <View style={destaca ? s.metricaDestaca : s.metrica}>
      <Text style={s.metricaLabel}>{label}</Text>
      <Text style={destaca ? s.metricaValorAcento : s.metricaValor}>{valor}</Text>
      {sub ? <Text style={s.metricaSub}>{sub}</Text> : null}
    </View>
  )
}

function PiePagina({ numero, empresa }: { numero: number; empresa: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>{empresa} — Propuesta técnica y comercial</Text>
      <Text style={s.footerTxt}>Página {numero}</Text>
    </View>
  )
}

export function PropuestaBombeoPDF({ datos }: Props) {
  const { cotizacion: cot, empresa } = datos

  const nombreCliente = cot.clientes?.nombre ?? 'Sin nombre'
  const fecha = new Date(cot.created_at).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Desglose de precio
  const bombaTotal = cot.bomba_precio ?? 0
  const panelesTotal = (cot.panel_precio_unit ?? 0) * (cot.panel_cantidad ?? 0)
  const vfdTotal = cot.vfd_precio ?? 0
  const instalacion = cot.instalacion_usd

  const cubrimientoOk = (cot.litros_disponibles ?? 0) >= cot.litros_dia_requeridos

  return (
    <Document
      title={`Propuesta ${cot.numero_cotizacion}`}
      author={empresa.nombre_empresa}
      subject="Propuesta Sistema de Bombeo Solar"
    >
      {/* ──────────── PÁGINA 1: Resumen técnico ──────────── */}
      <Page size="A4" style={s.pagina}>
        <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />

        <View style={s.body}>
          {/* Cliente */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Datos del cliente</Text>
            <View style={s.tarjeta}>
              <FilaDato label="Titular" valor={nombreCliente} />
              {cot.provincia ? <FilaDato label="Provincia" valor={cot.provincia} /> : null}
              <View style={[s.fila, { borderBottomWidth: 0 }]}>
                <Text style={s.filaLabel}>Fecha de propuesta</Text>
                <Text style={s.filaValor}>{fecha}</Text>
              </View>
            </View>
          </View>

          {/* Resumen ejecutivo */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Resumen ejecutivo</Text>
            <View style={s.grid2}>
              <Metrica
                label="Inversión total"
                valor={usd(cot.total_usd)}
                sub={`Instalación: ${usd(instalacion)}`}
                destaca
              />
              <Metrica
                label="Potencia de bomba"
                valor={`${num(cot.potencia_hp, 1)} HP`}
                sub={`${num(cot.potencia_kw, 2)} kW`}
              />
            </View>
            <View style={s.grid2}>
              <Metrica
                label="Agua disponible / día"
                valor={`${num(cot.litros_disponibles ?? 0, 0)} L`}
                sub={cubrimientoOk ? 'Cubre el requerimiento' : 'No cubre el requerimiento'}
              />
              <Metrica
                label="Requerimiento diario"
                valor={`${num(cot.litros_dia_requeridos, 0)} L`}
                sub={`Caudal: ${num(cot.caudal_m3h, 2)} m³/h`}
              />
            </View>
          </View>

          {/* Especificaciones técnicas */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Especificaciones técnicas</Text>
            <View style={s.tarjeta}>
              <FilaDato label="Tipo de sistema" valor={ETIQUETAS_SISTEMA[cot.tipo_sistema] ?? cot.tipo_sistema} />
              <FilaDato label="Tipo de bomba" valor={ETIQUETAS_BOMBA[cot.tipo_bomba] ?? cot.tipo_bomba} />
              {cot.profundidad_m ? (
                <FilaDato label="Profundidad del pozo" valor={`${num(cot.profundidad_m, 0)} m`} />
              ) : null}
              <FilaDato label="Caudal requerido" valor={`${num(cot.caudal_m3h, 2)} m³/h`} />
              <FilaDato label="Altura de descarga" valor={`${num(cot.altura_descarga_m, 0)} m`} />
              {cot.kwp_necesario ? (
                <View style={[s.fila, { borderBottomWidth: 0 }]}>
                  <Text style={s.filaLabel}>Potencia solar necesaria</Text>
                  <Text style={s.filaValor}>{num(cot.kwp_necesario, 2)} KWp</Text>
                </View>
              ) : (
                <View style={[s.fila, { borderBottomWidth: 0 }]}>
                  <Text style={s.filaLabel}>Potencia calculada</Text>
                  <Text style={s.filaValor}>{num(cot.potencia_hp, 2)} HP / {num(cot.potencia_kw, 2)} kW</Text>
                </View>
              )}
            </View>
          </View>

          {/* Indicador de cobertura */}
          <View style={s.seccion}>
            <View style={[s.tarjeta, { backgroundColor: cubrimientoOk ? C.verdeBg : C.rojoBg, borderColor: cubrimientoOk ? C.verdeBorde : '#E8C5C5' }]}>
              <Text style={{ fontSize: 8, fontWeight: 500, color: cubrimientoOk ? C.verde : C.rojo, marginBottom: 4 }}>
                {cubrimientoOk ? 'Sistema cubre el requerimiento hídrico' : 'Cobertura parcial del requerimiento'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 24 }}>
                <View>
                  <Text style={[s.metricaLabel, { color: cubrimientoOk ? C.verde : C.rojo }]}>Disponible</Text>
                  <Text style={{ fontSize: 12, fontWeight: 500, color: cubrimientoOk ? C.verde : C.rojo }}>
                    {num(cot.litros_disponibles ?? 0, 0)} L/día
                  </Text>
                </View>
                <View>
                  <Text style={s.metricaLabel}>Requerido</Text>
                  <Text style={{ fontSize: 12, fontWeight: 500, color: C.texto }}>
                    {num(cot.litros_dia_requeridos, 0)} L/día
                  </Text>
                </View>
                {!cubrimientoOk ? (
                  <View>
                    <Text style={[s.metricaLabel, { color: C.rojo }]}>Déficit</Text>
                    <Text style={{ fontSize: 12, fontWeight: 500, color: C.rojo }}>
                      {num(cot.litros_dia_requeridos - (cot.litros_disponibles ?? 0), 0)} L/día
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <PiePagina numero={1} empresa={empresa.nombre_empresa} />
      </Page>

      {/* ──────────── PÁGINA 2: Equipo y desglose de precio ──────────── */}
      <Page size="A4" style={s.pagina}>
        <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />

        <View style={s.body}>
          {/* Tabla de equipo */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Equipo del sistema</Text>
            <View style={s.tablaWrap}>
              <View style={s.tablaHeader}>
                <Text style={[s.tablaColTxt, { flex: 2 }]}>Componente</Text>
                <Text style={[s.tablaColTxt, { flex: 2 }]}>Marca / Modelo</Text>
                <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Especificación</Text>
                <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Precio</Text>
              </View>

              {cot.bomba_marca ? (
                <View style={s.tablaFila}>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>Bomba {cot.tipo_bomba}</Text>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>{cot.bomba_marca} {cot.bomba_modelo ?? ''}</Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {cot.bomba_hp ? `${num(cot.bomba_hp, 1)} HP` : '—'}
                  </Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {bombaTotal > 0 ? usd(bombaTotal) : '—'}
                  </Text>
                </View>
              ) : null}

              {cot.panel_marca ? (
                <View style={s.tablaFilaAlterna}>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>Paneles solares</Text>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>{cot.panel_marca} {cot.panel_modelo ?? ''}</Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {cot.panel_w ? `${cot.panel_w}W × ${cot.panel_cantidad ?? 0}` : '—'}
                  </Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {panelesTotal > 0 ? usd(panelesTotal) : '—'}
                  </Text>
                </View>
              ) : null}

              {cot.vfd_marca ? (
                <View style={s.tablaFila}>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>Variador de frecuencia (VFD)</Text>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>{cot.vfd_marca} {cot.vfd_modelo ?? ''}</Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {cot.vfd_kw ? `${num(cot.vfd_kw, 1)} kW` : '—'}
                  </Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {vfdTotal > 0 ? usd(vfdTotal) : '—'}
                  </Text>
                </View>
              ) : null}

              <View style={[s.tablaFilaAlterna, { borderBottomWidth: 0 }]}>
                <Text style={[s.tablaCelda, { flex: 2 }]}>Instalación</Text>
                <Text style={[s.tablaCelda, { flex: 2 }]}>Mano de obra y materiales</Text>
                <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>—</Text>
                <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>{usd(instalacion)}</Text>
              </View>
            </View>
          </View>

          {/* Desglose de precio */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Desglose de inversión</Text>
            <View style={s.tarjeta}>
              {bombaTotal > 0 ? (
                <FilaDato label={`Bomba ${cot.tipo_bomba}`} valor={usd(bombaTotal)} />
              ) : null}
              {panelesTotal > 0 ? (
                <FilaDato label={`Paneles (${cot.panel_cantidad ?? 0} und)`} valor={usd(panelesTotal)} />
              ) : null}
              {vfdTotal > 0 ? (
                <FilaDato label="Variador de frecuencia (VFD)" valor={usd(vfdTotal)} />
              ) : null}
              <FilaDato label="Instalación" valor={usd(instalacion)} />
              <View style={s.sep} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontWeight: 500, color: C.texto }}>Total</Text>
                <Text style={{ fontSize: 13, fontWeight: 500, color: C.acento }}>{usd(cot.total_usd)}</Text>
              </View>
            </View>
          </View>

          {/* Notas */}
          {cot.notas ? (
            <View style={s.seccion}>
              <Text style={s.seccionTitulo}>Notas</Text>
              <View style={s.tarjeta}>
                <Text style={{ fontSize: 9, color: C.texto2, lineHeight: 1.5 }}>{cot.notas}</Text>
              </View>
            </View>
          ) : null}

          {/* Términos */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Términos y condiciones</Text>
            <View style={s.tarjeta}>
              {[
                'Esta propuesta tiene validez de 30 días calendario desde la fecha de emisión.',
                'Los precios están sujetos a disponibilidad de equipos al momento de la contratación.',
                'El caudal estimado depende de las condiciones del pozo verificadas en campo.',
                'Se incluye garantía de mano de obra de 1 año. Los equipos mantienen la garantía del fabricante.',
              ].map((t, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 5 }}>
                  <Text style={{ fontSize: 9, color: C.acento, fontWeight: 500 }}>{i + 1}.</Text>
                  <Text style={{ fontSize: 9, color: C.texto2, flex: 1, lineHeight: 1.4 }}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Firma */}
          <View style={{ marginTop: 4 }}>
            <View style={s.sep} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
              <View>
                <Text style={{ fontSize: 9, color: C.texto2, marginBottom: 2 }}>Generado por</Text>
                <Text style={{ fontSize: 11, fontWeight: 500, color: C.texto }}>{empresa.nombre_empresa}</Text>
                {empresa.telefono ? (
                  <Text style={{ fontSize: 9, color: C.texto3, marginTop: 1 }}>{empresa.telefono}</Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, color: C.texto3 }}>Propuesta generada con</Text>
                <Text style={{ fontSize: 9, fontWeight: 500, color: C.acento }}>SolarOS</Text>
              </View>
            </View>
          </View>
        </View>

        <PiePagina numero={2} empresa={empresa.nombre_empresa} />
      </Page>
    </Document>
  )
}
