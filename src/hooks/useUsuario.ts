'use client'

import { useUsuarioContext } from '@/components/usuario/UsuarioProvider'

export function useUsuario() {
  return useUsuarioContext()
}
