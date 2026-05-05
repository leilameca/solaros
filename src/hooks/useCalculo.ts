'use client'

import { useMemo } from 'react'
import { calcularSistema, calcularLey5707 } from '@/lib/calculos'
import type { InputCalculo, ResultadoCalculo, ResultadoLey5707 } from '@/types/cotizaciones'

interface UseCalculoInput extends InputCalculo {
  ley5707Activa: boolean
}

interface UseCalculoResult {
  resultado: ResultadoCalculo | null
  ley5707: ResultadoLey5707 | null
  esValido: boolean
}

export function useCalculo(input: Partial<UseCalculoInput>): UseCalculoResult {
  // Desestructurar para que el array de dependencias sea estable
  const { kwhMensual, provincia, tarifa, panelW, precioWp, tasaDolar, ley5707Activa } = input

  const resultado = useMemo<ResultadoCalculo | null>(() => {
    if (!kwhMensual || !provincia || !tarifa || !panelW || !precioWp || !tasaDolar) {
      return null
    }
    if (kwhMensual <= 0 || panelW <= 0 || precioWp <= 0) {
      return null
    }

    return calcularSistema({
      kwhMensual,
      provincia,
      tarifa,
      panelW,
      precioWp,
      tasaDolar,
    })
  }, [kwhMensual, provincia, tarifa, panelW, precioWp, tasaDolar])

  const ley5707 = useMemo<ResultadoLey5707 | null>(() => {
    if (!resultado || !ley5707Activa) return null
    return calcularLey5707(resultado.totalUsd, resultado.ahorroAnualUsd)
  }, [resultado, ley5707Activa])

  return {
    resultado,
    ley5707,
    esValido: resultado !== null,
  }
}
