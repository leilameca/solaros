'use client'

import { Document, Page, View, Text } from '@react-pdf/renderer'
import { s, C, rd, usd, num } from './shared/estilosPDF'
import { HeaderEmpresaPDF } from './shared/HeaderEmpresaPDF'
import type { DatosPropuestaElectrico } from '@/types/pdf'

const ITBIS = 0.18

interface Props {
  datos: DatosPropuestaElectrico
}

function FilaDato({ label, valor, colorValor }: { label: string; valor: string; colorValor?: string }) {
  return (
    <View style={s.fila}>
      <Text style={s.filaLabel}>{label}</Text>
      <Text style={[s.filaValor, colorValor ? { color: colorValor } : {}]}>{valor}</Text>
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

export function PropuestaElectricoPDF({ datos }: Props) {
  const { cotizacion: cot, items, empresa } = datos

  const nombreCliente = cot.clientes?.nombre ?? 'Sin nombre'
  const fecha = new Date(cot.created_at).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Partimos los items en 2 páginas si hay muchos
  const ITEMS_PAGINA1 = 18
  const itemsPag1 = items.slice(0, ITEMS_PAGINA1)
  const itemsPag2 = items.slice(ITEMS_PAGINA1)

  return (
    <Document
      title={`Propuesta ${cot.numero_cotizacion}`}
      author={empresa.nombre_empresa}
      subject="Propuesta Servicio Eléctrico"
    >
      {/* ──────────── PÁGINA 1: Cliente + Materiales ──────────── */}
      <Page size="A4" style={s.pagina}>
        <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />

        <View style={s.body}>
          {/* Datos del cliente y servicio */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.seccionTitulo}>Cliente</Text>
              <View style={s.tarjeta}>
                <FilaDato label="Titular" valor={nombreCliente} />
                {cot.clientes?.telefono ? (
                  <FilaDato label="Teléfono" valor={cot.clientes.telefono} />
                ) : null}
                {cot.clientes?.email ? (
                  <FilaDato label="Email" valor={cot.clientes.email} />
                ) : null}
                <View style={[s.fila, { borderBottomWidth: 0 }]}>
                  <Text style={s.filaLabel}>Fecha</Text>
                  <Text style={s.filaValor}>{fecha}</Text>
                </View>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={s.seccionTitulo}>Servicio</Text>
              <View style={s.tarjeta}>
                <FilaDato label="Tipo de trabajo" valor={cot.tipo_trabajo} />
                {cot.descripcion ? (
                  <View style={[s.fila, { borderBottomWidth: 0, flexDirection: 'column', gap: 2 }]}>
                    <Text style={s.filaLabel}>Descripción</Text>
                    <Text style={{ fontSize: 9, color: C.texto, lineHeight: 1.4, marginTop: 2 }}>
                      {cot.descripcion}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Métricas financieras */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Resumen financiero</Text>
            <View style={s.grid4}>
              <View style={s.metricaDestaca}>
                <Text style={s.metricaLabel}>Total RD$</Text>
                <Text style={s.metricaValorAcento}>{rd(cot.total_rd)}</Text>
              </View>
              <View style={s.metrica}>
                <Text style={s.metricaLabel}>Total USD</Text>
                <Text style={s.metricaValor}>{usd(cot.total_usd)}</Text>
                <Text style={s.metricaSub}>Tasa {cot.tasa_dolar}</Text>
              </View>
              <View style={s.metrica}>
                <Text style={s.metricaLabel}>Materiales</Text>
                <Text style={s.metricaValor}>{rd(cot.subtotal_materiales_rd)}</Text>
              </View>
              <View style={s.metrica}>
                <Text style={s.metricaLabel}>Mano de obra</Text>
                <Text style={s.metricaValor}>{rd(cot.mano_obra_rd)}</Text>
              </View>
            </View>
          </View>

          {/* Tabla de materiales */}
          {items.length > 0 ? (
            <View style={s.seccion}>
              <Text style={s.seccionTitulo}>
                Materiales — {items.length} item{items.length !== 1 ? 's' : ''}
              </Text>
              <View style={s.tablaWrap}>
                <View style={s.tablaHeader}>
                  <Text style={[s.tablaColTxt, { flex: 3 }]}>Descripción</Text>
                  <Text style={[s.tablaColTxt, { width: 40 }]}>Unidad</Text>
                  <Text style={[s.tablaColTxt, { width: 36, textAlign: 'right' }]}>Cant.</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>P. Unit RD$</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Subtotal</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>c/ ITBIS</Text>
                </View>

                {itemsPag1.map((item, idx) => {
                  const subtotal = item.precio_unit_rd * item.cantidad
                  const total = subtotal * (1 + ITBIS)
                  return (
                    <View
                      key={item.id}
                      style={[
                        idx % 2 === 0 ? s.tablaFila : s.tablaFilaAlterna,
                        idx === itemsPag1.length - 1 && itemsPag2.length === 0
                          ? { borderBottomWidth: 0 }
                          : {},
                      ]}
                    >
                      <Text style={[s.tablaCelda, { flex: 3 }]}>{item.descripcion}</Text>
                      <Text style={[s.tablaCeldaLabel, { width: 40 }]}>{item.unidad}</Text>
                      <Text style={[s.tablaCeldaMono, { width: 36, textAlign: 'right' }]}>
                        {item.cantidad}
                      </Text>
                      <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                        {rd(item.precio_unit_rd)}
                      </Text>
                      <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right', color: C.texto2 }]}>
                        {rd(subtotal)}
                      </Text>
                      <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                        {rd(total)}
                      </Text>
                    </View>
                  )
                })}

                {/* Footer totales (solo si no hay segunda página de items) */}
                {itemsPag2.length === 0 ? (
                  <TotalesTabla cot={cot} />
                ) : null}
              </View>
            </View>
          ) : (
            <View style={[s.tarjeta, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={{ fontSize: 10, color: C.texto3 }}>Sin materiales registrados</Text>
            </View>
          )}
        </View>

        <PiePagina numero={1} empresa={empresa.nombre_empresa} />
      </Page>

      {/* ──────────── PÁGINA 2: Continuación materiales + Términos ──────────── */}
      {itemsPag2.length > 0 ? (
        <Page size="A4" style={s.pagina}>
          <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />

          <View style={s.body}>
            <View style={s.seccion}>
              <Text style={s.seccionTitulo}>Materiales (continuación)</Text>
              <View style={s.tablaWrap}>
                <View style={s.tablaHeader}>
                  <Text style={[s.tablaColTxt, { flex: 3 }]}>Descripción</Text>
                  <Text style={[s.tablaColTxt, { width: 40 }]}>Unidad</Text>
                  <Text style={[s.tablaColTxt, { width: 36, textAlign: 'right' }]}>Cant.</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>P. Unit RD$</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Subtotal</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>c/ ITBIS</Text>
                </View>

                {itemsPag2.map((item, idx) => {
                  const subtotal = item.precio_unit_rd * item.cantidad
                  const total = subtotal * (1 + ITBIS)
                  return (
                    <View
                      key={item.id}
                      style={[
                        idx % 2 === 0 ? s.tablaFila : s.tablaFilaAlterna,
                        idx === itemsPag2.length - 1 ? { borderBottomWidth: 0 } : {},
                      ]}
                    >
                      <Text style={[s.tablaCelda, { flex: 3 }]}>{item.descripcion}</Text>
                      <Text style={[s.tablaCeldaLabel, { width: 40 }]}>{item.unidad}</Text>
                      <Text style={[s.tablaCeldaMono, { width: 36, textAlign: 'right' }]}>
                        {item.cantidad}
                      </Text>
                      <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                        {rd(item.precio_unit_rd)}
                      </Text>
                      <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right', color: C.texto2 }]}>
                        {rd(subtotal)}
                      </Text>
                      <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                        {rd(total)}
                      </Text>
                    </View>
                  )
                })}
                <TotalesTabla cot={cot} />
              </View>
            </View>

            <TerminosYFirma empresa={empresa} />
          </View>

          <PiePagina numero={2} empresa={empresa.nombre_empresa} />
        </Page>
      ) : null}

      {/* Si no hay segunda página de items, los términos van en página 1 */}
      {itemsPag2.length === 0 ? (
        <Page size="A4" style={s.pagina}>
          <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />
          <View style={s.body}>
            {cot.notas ? (
              <View style={s.seccion}>
                <Text style={s.seccionTitulo}>Notas</Text>
                <View style={s.tarjeta}>
                  <Text style={{ fontSize: 9, color: C.texto2, lineHeight: 1.5 }}>{cot.notas}</Text>
                </View>
              </View>
            ) : null}
            <TerminosYFirma empresa={empresa} />
          </View>
          <PiePagina numero={2} empresa={empresa.nombre_empresa} />
        </Page>
      ) : null}
    </Document>
  )
}

// ─── Subcomponentes internos ───────────────────────────────────────────────

function TotalesTabla({ cot }: { cot: DatosPropuestaElectrico['cotizacion'] }) {
  return (
    <View style={[s.tablaFooter, { flexDirection: 'column', gap: 0 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
        <Text style={{ fontSize: 8, color: C.texto3 }}>Subtotal materiales</Text>
        <Text style={{ fontSize: 9, color: C.texto, fontWeight: 500 }}>
          {rd(cot.subtotal_materiales_rd)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
        <Text style={{ fontSize: 8, color: C.texto3 }}>ITBIS 18%</Text>
        <Text style={{ fontSize: 9, color: C.texto3 }}>{rd(cot.itbis_rd)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
        <Text style={{ fontSize: 8, color: C.texto3 }}>Mano de obra</Text>
        <Text style={{ fontSize: 9, color: C.texto, fontWeight: 500 }}>{rd(cot.mano_obra_rd)}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: C.borde, marginVertical: 4 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
        <Text style={{ fontSize: 10, fontWeight: 500, color: C.texto }}>Total</Text>
        <Text style={{ fontSize: 12, fontWeight: 500, color: C.texto }}>{rd(cot.total_rd)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 }}>
        <Text style={{ fontSize: 8, color: C.texto3 }}>Equivalente USD (tasa {cot.tasa_dolar})</Text>
        <Text style={{ fontSize: 10, fontWeight: 500, color: C.acento }}>
          {usd(cot.total_usd)}
        </Text>
      </View>
    </View>
  )
}

function TerminosYFirma({ empresa }: { empresa: DatosPropuestaElectrico['empresa'] }) {
  return (
    <>
      <View style={s.seccion}>
        <Text style={s.seccionTitulo}>Términos y condiciones</Text>
        <View style={s.tarjeta}>
          {[
            'Esta propuesta tiene validez de 30 días calendario desde la fecha de emisión.',
            'Los precios incluyen ITBIS (18%) sobre materiales. La mano de obra no lleva ITBIS.',
            'Cualquier trabajo adicional no descrito en esta propuesta será cotizado por separado.',
            'Se requiere un pago inicial del 50% para iniciar los trabajos.',
            'Garantía de mano de obra de 90 días a partir de la finalización de los trabajos.',
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 5 }}>
              <Text style={{ fontSize: 9, color: C.acento, fontWeight: 500 }}>{i + 1}.</Text>
              <Text style={{ fontSize: 9, color: C.texto2, flex: 1, lineHeight: 1.4 }}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

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
    </>
  )
}
