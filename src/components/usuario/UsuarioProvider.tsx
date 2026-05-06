'use client'

import { createContext, useContext } from 'react'
import type { ContextoUsuarioApp } from '@/types/usuario'

const UsuarioContext = createContext<ContextoUsuarioApp>({
  usuario: null,
  empresa: null,
})

export function UsuarioProvider({
  value,
  children,
}: {
  value: ContextoUsuarioApp
  children: React.ReactNode
}) {
  return <UsuarioContext.Provider value={value}>{children}</UsuarioContext.Provider>
}

export function useUsuarioContext() {
  return useContext(UsuarioContext)
}
