'use client'

import { useMemo } from 'react'

function obtenerSaludo(hora: number) {
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function obtenerFechaLarga() {
  const fecha = new Date().toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return fecha.charAt(0).toUpperCase() + fecha.slice(1)
}

export function SaludoHeader({ nombre }: { nombre: string }) {
  const { saludo, fechaLarga } = useMemo(() => {
    const ahora = new Date()
    return {
      saludo: obtenerSaludo(ahora.getHours()),
      fechaLarga: obtenerFechaLarga(),
    }
  }, [])

  return (
    <div>
      <h1 className="text-[24px] font-medium text-[var(--text)] tracking-[-0.03em]">
        {saludo}, {nombre}
      </h1>
      <p className="text-[13px] text-[var(--text-3)] mt-1">{fechaLarga}</p>
    </div>
  )
}
