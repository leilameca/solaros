import 'server-only'

import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RolUsuarioEmpresa } from '@/types/configuracion'

function esRolValido(valor: unknown): valor is RolUsuarioEmpresa {
  return valor === 'admin' || valor === 'vendedor' || valor === 'tecnico'
}

export async function sincronizarUsuarioDesdeAuth(
  user: User,
  fallback?: {
    nombre?: string
    cargo?: string | null
    empresaId?: string | null
    rol?: RolUsuarioEmpresa
  }
) {
  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('usuarios')
    .select('id, empresa_id, nombre, email, rol, cargo, activo')
    .eq('id', user.id)
    .maybeSingle()

  const nombreDesdeMetadata =
    (typeof user.user_metadata?.nombre === 'string' && user.user_metadata.nombre.trim()) ||
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    fallback?.nombre?.trim() ||
    user.email?.split('@')[0] ||
    'Admin'

  const email = user.email ?? existente?.email ?? ''
  const empresaId =
    existente?.empresa_id ??
    (typeof user.user_metadata?.empresa_id === 'string' ? user.user_metadata.empresa_id : null) ??
    fallback?.empresaId ??
    null
  const cargo =
    existente?.cargo ??
    (typeof user.user_metadata?.cargo === 'string' ? user.user_metadata.cargo : null) ??
    fallback?.cargo ??
    null
  const rol =
    existente?.rol ??
    (esRolValido(user.user_metadata?.rol) ? user.user_metadata.rol : null) ??
    fallback?.rol ??
    'admin'

  const payload = {
    id: user.id,
    empresa_id: empresaId,
    nombre: existente?.nombre?.trim() ? existente.nombre : nombreDesdeMetadata,
    email,
    rol,
    cargo,
    activo: existente?.activo ?? true,
  }

  const { error } = await admin.from('usuarios').upsert(payload)

  if (error) {
    throw error
  }

  return payload
}
