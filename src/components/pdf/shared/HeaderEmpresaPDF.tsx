'use client'

import { View, Text, Image } from '@react-pdf/renderer'
import { s, C } from './estilosPDF'
import type { EmpresaPDFConfig } from '@/types/pdf'

interface Props {
  empresa: EmpresaPDFConfig
  numeroCotizacion: string
}

export function HeaderEmpresaPDF({ empresa, numeroCotizacion }: Props) {
  const contacto = [empresa.telefono, empresa.email].filter(Boolean).join('  ·  ')

  return (
    <View style={s.header}>
      <View style={s.headerIzq}>
        {empresa.logo_url ? (
          <Image src={empresa.logo_url} style={s.headerLogo} />
        ) : (
          <View style={s.headerLogoPlaceholder}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
              {empresa.nombre_empresa.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View>
          <Text style={s.headerNombre}>{empresa.nombre_empresa}</Text>
          {contacto ? <Text style={s.headerContacto}>{contacto}</Text> : null}
        </View>
      </View>

      <View style={s.headerDer}>
        <Text style={s.headerNumeroLabel}>Propuesta</Text>
        <Text style={s.headerNumero}>{numeroCotizacion}</Text>
      </View>
    </View>
  )
}
