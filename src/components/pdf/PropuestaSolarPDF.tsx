'use client'

import {
  Document,
  Page,
  View,
  Text,
  Image,
} from '@react-pdf/renderer'
import { s, C, usd, rd, num } from './shared/estilosPDF'
import { HeaderEmpresaPDF } from './shared/HeaderEmpresaPDF'
import type { DatosPropuestaSolar } from '@/types/pdf'

const ETIQUETAS_SISTEMA: Record<string, string> = {
  on_grid: 'On-Grid',
  off_grid: 'Off-Grid',
  hibrido: 'Híbrido',
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

interface Props {
  datos: DatosPropuestaSolar
}

function FilaDato({ label, valor, colorValor }: { label: string; valor: string; colorValor?: string }) {
  return (
    <View style={s.fila}>
      <Text style={s.filaLabel}>{label}</Text>
      <Text style={[s.filaValor, colorValor ? { color: colorValor } : {}]}>{valor}</Text>
    </View>
  )
}

function Metrica({
  label,
  valor,
  sub,
  destaca,
}: {
  label: string
  valor: string
  sub?: string
  destaca?: boolean
}) {
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

export function PropuestaSolarPDF({ datos }: Props) {
  const { cotizacion: cot, consumoMensual, empresa, imagenGrafico } = datos

  const nombreCliente = cot.clientes?.nombre ?? 'Sin nombre'
  const contrato = cot.clientes?.numero_contrato ?? '—'
  const fecha = new Date(cot.created_at).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Tabla ROI 10 años
  const ahorroAnualUsd = cot.ahorro_anual_usd ?? 0
  const descuentoAnualUsd = cot.ley_5707_activa ? (cot.total_usd * 0.38) / 3 : 0
  const roiFilas = Array.from({ length: 10 }, (_, i) => {
    const ano = i + 1
    const credito = ano <= 3 ? descuentoAnualUsd : 0
    const acumulado =
      ano <= 3
        ? (ahorroAnualUsd + descuentoAnualUsd) * ano
        : (ahorroAnualUsd + descuentoAnualUsd) * 3 + ahorroAnualUsd * (ano - 3)
    return { ano, ahorro: ahorroAnualUsd, credito, acumulado, balance: acumulado - cot.total_usd }
  })

  return (
    <Document
      title={`Propuesta ${cot.numero_cotizacion}`}
      author={empresa.nombre_empresa}
      subject="Propuesta Sistema Solar"
    >
      {/* ──────────── PÁGINA 1: Portada + Resumen ejecutivo ──────────── */}
      <Page size="A4" style={s.pagina}>
        <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />

        <View style={s.body}>
          {/* Datos del cliente */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Datos del cliente</Text>
            <View style={s.tarjeta}>
              <FilaDato label="Titular" valor={nombreCliente} />
              <FilaDato label="N° contrato eléctrico" valor={contrato} />
              <FilaDato label="Provincia" valor={cot.provincia} />
              <FilaDato label="Tipo de sistema" valor={ETIQUETAS_SISTEMA[cot.tipo_sistema] ?? cot.tipo_sistema} />
              <View style={[s.fila, { borderBottomWidth: 0 }]}>
                <Text style={s.filaLabel}>Fecha de propuesta</Text>
                <Text style={s.filaValor}>{fecha}</Text>
              </View>
            </View>
          </View>

          {/* Resumen ejecutivo 2×2 */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Resumen ejecutivo</Text>
            <View style={s.grid2}>
              <Metrica
                label="Potencia del sistema"
                valor={`${num(cot.kwp_calculado)} KWp`}
                sub={`${cot.horas_sol} h sol / día`}
              />
              <Metrica
                label="Cantidad de paneles"
                valor={`${cot.panel_cantidad ?? '—'} und`}
                sub={cot.panel_marca ? `${cot.panel_marca} ${cot.panel_potencia_w ?? ''}W` : undefined}
              />
            </View>
            <View style={s.grid2}>
              <Metrica
                label="Inversión total"
                valor={usd(cot.total_usd)}
                sub={`$${cot.precio_wp}/Wp`}
                destaca
              />
              <Metrica
                label="Retorno estimado"
                valor={`${cot.retorno_sin_ley ?? '—'} años`}
                sub={cot.ley_5707_activa ? `${cot.retorno_con_ley} años con Ley 57-07` : 'Sin Ley 57-07'}
              />
            </View>
          </View>

          {/* Generación */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Generación estimada</Text>
            <View style={s.grid2}>
              <Metrica
                label="Generación mensual"
                valor={`${num(cot.generacion_mensual)} KWh`}
                sub="Promedio con variación estacional"
              />
              <Metrica
                label="Generación anual"
                valor={`${num(cot.generacion_anual)} KWh`}
                sub={`Consumo base: ${num(cot.kwh_mensual, 0)} KWh/mes`}
              />
            </View>
          </View>

          {/* Ahorro financiero */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Impacto financiero</Text>
            <View style={s.tarjeta}>
              <FilaDato label="Ahorro mensual" valor={rd(cot.ahorro_mensual_rd ?? 0)} colorValor={C.verde} />
              <FilaDato label="Ahorro anual (USD)" valor={usd(cot.ahorro_anual_usd ?? 0)} colorValor={C.verde} />
              <View style={[s.fila, { borderBottomWidth: 0 }]}>
                <Text style={s.filaLabel}>Tasa de cambio</Text>
                <Text style={s.filaValor}>RD$ {cot.tasa_dolar} / USD</Text>
              </View>
            </View>
          </View>
        </View>

        <PiePagina numero={1} empresa={empresa.nombre_empresa} />
      </Page>

      {/* ──────────── PÁGINA 2: Detalle técnico y financiero ──────────── */}
      <Page size="A4" style={s.pagina}>
        <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />

        <View style={s.body}>
          {/* Equipo */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Equipo del sistema</Text>
            <View style={s.tablaWrap}>
              <View style={s.tablaHeader}>
                <Text style={[s.tablaColTxt, { flex: 3 }]}>Componente</Text>
                <Text style={[s.tablaColTxt, { flex: 2 }]}>Marca / Modelo</Text>
                <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Potencia</Text>
                <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Cant.</Text>
              </View>
              {cot.panel_marca ? (
                <View style={s.tablaFila}>
                  <Text style={[s.tablaCelda, { flex: 3 }]}>Panel fotovoltaico</Text>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>
                    {cot.panel_marca} {cot.panel_modelo ?? ''}
                  </Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {cot.panel_potencia_w ?? '—'} W
                  </Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {cot.panel_cantidad ?? '—'}
                  </Text>
                </View>
              ) : null}
              {cot.inversor_marca ? (
                <View style={[s.tablaFilaAlterna, { borderBottomWidth: 0 }]}>
                  <Text style={[s.tablaCelda, { flex: 3 }]}>Inversor</Text>
                  <Text style={[s.tablaCelda, { flex: 2 }]}>
                    {cot.inversor_marca} {cot.inversor_modelo ?? ''}
                  </Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {cot.inversor_kw ?? '—'} kW
                  </Text>
                  <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                    {cot.inversor_cantidad ?? 1}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Ley 57-07 */}
          {cot.ley_5707_activa && cot.inversion_neta_usd ? (
            <View style={s.seccion}>
              <Text style={s.seccionTitulo}>Beneficio Ley 57-07 — Energías renovables</Text>
              <View style={s.tarjetaVerde}>
                <View style={s.grid4}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.metricaLabel, { color: C.verde }]}>Inversión total</Text>
                    <Text style={[s.metricaValor, { color: C.texto }]}>{usd(cot.total_usd)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.metricaLabel, { color: C.verde }]}>Descuento / año (×3)</Text>
                    <Text style={[s.metricaValorVerde, {}]}>{usd(descuentoAnualUsd)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.metricaLabel, { color: C.verde }]}>Inversión neta</Text>
                    <Text style={[s.metricaValor, { color: C.texto }]}>{usd(cot.inversion_neta_usd)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.metricaLabel, { color: C.verde }]}>Retorno con ley</Text>
                    <Text style={[s.metricaValorAcento, {}]}>{cot.retorno_con_ley} años</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 7.5, color: C.verde, marginTop: 4 }}>
                  Descuento fiscal del 38% distribuido en 3 años según Ley 57-07 de Incentivo a las Energías Renovables.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Tabla ROI 10 años */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>
              Retorno de inversión — 10 años{cot.ley_5707_activa ? ' (incluye Ley 57-07)' : ''}
            </Text>
            <View style={s.tablaWrap}>
              <View style={s.tablaHeader}>
                <Text style={[s.tablaColTxt, { width: 36 }]}>Año</Text>
                <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Ahorro anual</Text>
                {cot.ley_5707_activa ? (
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Crédito fiscal</Text>
                ) : null}
                <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Acumulado</Text>
                <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Balance</Text>
              </View>
              {roiFilas.map((fila, idx) => {
                const balancePositivo = fila.balance >= 0
                const FilaComp = idx % 2 === 0 ? s.tablaFila : s.tablaFilaAlterna
                return (
                  <View
                    key={fila.ano}
                    style={[
                      FilaComp,
                      idx === 9 ? { borderBottomWidth: 0 } : {},
                      balancePositivo ? { backgroundColor: C.verdeBg } : {},
                    ]}
                  >
                    <Text style={[s.tablaCelda, { width: 36, fontWeight: 500 }]}>
                      {fila.ano}
                    </Text>
                    <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                      {usd(fila.ahorro)}
                    </Text>
                    {cot.ley_5707_activa ? (
                      <Text
                        style={[
                          s.tablaCeldaMono,
                          { flex: 1, textAlign: 'right', color: fila.credito > 0 ? C.verde : C.texto3 },
                        ]}
                      >
                        {fila.credito > 0 ? usd(fila.credito) : '—'}
                      </Text>
                    ) : null}
                    <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right' }]}>
                      {usd(fila.acumulado)}
                    </Text>
                    <Text
                      style={[
                        s.tablaCeldaMono,
                        {
                          flex: 1,
                          textAlign: 'right',
                          color: balancePositivo ? C.verde : C.rojo,
                        },
                      ]}
                    >
                      {fila.balance >= 0 ? '+' : ''}
                      {usd(fila.balance)}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        <PiePagina numero={2} empresa={empresa.nombre_empresa} />
      </Page>

      {/* ──────────── PÁGINA 3: Gráfico + Términos ──────────── */}
      <Page size="A4" style={s.pagina}>
        <HeaderEmpresaPDF empresa={empresa} numeroCotizacion={cot.numero_cotizacion} />

        <View style={s.body}>
          {/* Gráfico generación vs consumo */}
          {imagenGrafico ? (
            <View style={s.seccion}>
              <Text style={s.seccionTitulo}>Generación vs consumo — 12 meses</Text>
              <View style={[s.tarjeta, { padding: 8 }]}>
                <Image src={imagenGrafico} style={{ width: '100%', height: 220 }} />
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 6, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.azul }} />
                    <Text style={{ fontSize: 8, color: C.texto2 }}>Consumo</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.verde }} />
                    <Text style={{ fontSize: 8, color: C.texto2 }}>Generación</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Detalle mensual compacto */}
          {consumoMensual.length > 0 ? (
            <View style={s.seccion}>
              <Text style={s.seccionTitulo}>Detalle mensual</Text>
              <View style={s.tablaWrap}>
                <View style={s.tablaHeader}>
                  <Text style={[s.tablaColTxt, { flex: 1 }]}>Mes</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right', color: C.azul }]}>Consumo</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right', color: C.verde }]}>Generación</Text>
                  <Text style={[s.tablaColTxt, { flex: 1, textAlign: 'right' }]}>Balance</Text>
                </View>
                {[...consumoMensual]
                  .sort((a, b) => a.mes - b.mes)
                  .map((m, idx) => {
                    const balance = m.generacion_kwh - m.consumo_kwh
                    return (
                      <View
                        key={m.mes}
                        style={[
                          idx % 2 === 0 ? s.tablaFila : s.tablaFilaAlterna,
                          idx === consumoMensual.length - 1 ? { borderBottomWidth: 0 } : {},
                        ]}
                      >
                        <Text style={[s.tablaCelda, { flex: 1, fontWeight: 500, color: C.texto2 }]}>
                          {MESES[m.mes - 1]}
                        </Text>
                        <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right', color: C.azul }]}>
                          {num(m.consumo_kwh, 0)} KWh
                        </Text>
                        <Text style={[s.tablaCeldaMono, { flex: 1, textAlign: 'right', color: C.verde }]}>
                          {num(m.generacion_kwh, 0)} KWh
                        </Text>
                        <Text
                          style={[
                            s.tablaCeldaMono,
                            { flex: 1, textAlign: 'right', color: balance >= 0 ? C.verde : C.rojo },
                          ]}
                        >
                          {balance >= 0 ? '+' : ''}
                          {num(balance, 0)} KWh
                        </Text>
                      </View>
                    )
                  })}
              </View>
            </View>
          ) : null}

          {/* Términos y condiciones */}
          <View style={s.seccion}>
            <Text style={s.seccionTitulo}>Términos y condiciones</Text>
            <View style={s.tarjeta}>
              {[
                'Esta propuesta tiene una validez de 30 días calendario a partir de la fecha de emisión.',
                'Los precios están sujetos a variaciones del mercado y disponibilidad de equipos al momento de la contratación.',
                'La generación estimada es un cálculo basado en datos de irradiación solar histórica para la provincia indicada.',
                'Los ahorros proyectados dependen del consumo real y de las tarifas eléctricas vigentes al momento de la instalación.',
                'El tiempo de instalación estimado es de 3 a 7 días hábiles según la complejidad del proyecto.',
                'Se incluye garantía de mano de obra de 1 año. Los equipos mantienen la garantía del fabricante.',
              ].map((termino, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 6, marginBottom: 5 }}>
                  <Text style={{ fontSize: 9, color: C.acento, fontWeight: 500 }}>{idx + 1}.</Text>
                  <Text style={{ fontSize: 9, color: C.texto2, flex: 1, lineHeight: 1.4 }}>{termino}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Firma */}
          <View style={{ marginTop: 8 }}>
            <View style={[s.sep, { marginBottom: 12 }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={{ fontSize: 9, color: C.texto2, marginBottom: 2 }}>
                  Generado por
                </Text>
                <Text style={{ fontSize: 11, fontWeight: 500, color: C.texto }}>
                  {empresa.nombre_empresa}
                </Text>
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

        <PiePagina numero={3} empresa={empresa.nombre_empresa} />
      </Page>
    </Document>
  )
}
