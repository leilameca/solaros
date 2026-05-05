'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'
import type { ClienteNota, EtapaPipeline, NuevaClienteInput } from '@/types/clientes'

export async function crearCliente(input: NuevaClienteInput) {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()

  if (!empresaId) redirect('/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: cliente, error } = await supabase
    .from('clientes')
    .insert({
      empresa_id: empresaId,
      nombre: input.nombre.trim(),
      email: input.email.trim() || null,
      telefono: input.telefono.trim() || null,
      whatsapp: input.whatsapp.trim() || null,
      numero_contrato: input.numero_contrato.trim() || null,
      provincia: input.provincia.trim() || null,
      notas: input.notas.trim() || null,
      etapa_pipeline: input.etapa_pipeline,
    })
    .select('id')
    .single()

  if (error || !cliente) {
    return { error: error?.message ?? 'No se pudo crear el cliente' }
  }

  revalidatePath('/clientes')
  redirect(`/clientes/${cliente.id}`)
}

export async function actualizarEtapaCliente(clienteId: string, etapa: EtapaPipeline) {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()

  if (!empresaId) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('clientes')
    .update({ etapa_pipeline: etapa })
    .eq('id', clienteId)
    .eq('empresa_id', empresaId)

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clienteId}`)
  return { ok: true }
}

export async function crearNotaCliente(clienteId: string, nota: string) {
  const supabase = createClient()
  const empresaId = await obtenerEmpresaId()

  if (!empresaId) {
    return { error: 'No autenticado' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const texto = nota.trim()
  if (!texto) {
    return { error: 'La nota no puede estar vacia' }
  }

  const { data: notaCreada, error } = await supabase
    .from('cliente_notas')
    .insert({
      empresa_id: empresaId,
      cliente_id: clienteId,
      nota: texto,
      created_by: user.id,
    })
    .select('id, empresa_id, cliente_id, nota, created_at, created_by')
    .single()

  if (error || !notaCreada) {
    return { error: error?.message ?? 'No se pudo guardar la nota' }
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, email')
    .eq('id', user.id)
    .single()

  revalidatePath(`/clientes/${clienteId}`)

  return {
    ok: true,
    nota: {
      ...(notaCreada as ClienteNota),
      usuarios: usuario ?? null,
    } satisfies ClienteNota,
  }
}
