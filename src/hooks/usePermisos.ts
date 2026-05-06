'use client'

import { PERMISOS } from '@/lib/permisos'
import { useUsuario } from '@/hooks/useUsuario'

export function usePermisos() {
  const { usuario } = useUsuario()

  if (!usuario) {
    return PERMISOS.vendedor
  }

  if (usuario.esSuperadmin) {
    return PERMISOS.admin
  }

  return PERMISOS[usuario.rol]
}
