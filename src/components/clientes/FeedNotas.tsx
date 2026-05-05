'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { crearNotaCliente } from '@/app/(dashboard)/clientes/actions'
import type { ClienteNota } from '@/types/clientes'

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function FeedNotas({
  clienteId,
  notasIniciales,
}: {
  clienteId: string
  notasIniciales: ClienteNota[]
}) {
  const [notas, setNotas] = useState<ClienteNota[]>(notasIniciales)
  const [valor, setValor] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function agregarNota() {
    const texto = valor.trim()
    if (!texto) return

    setError(null)

    const temporal: ClienteNota = {
      id: `temp-${Date.now()}`,
      empresa_id: '',
      cliente_id: clienteId,
      nota: texto,
      created_at: new Date().toISOString(),
      created_by: null,
      usuarios: {
        nombre: 'Guardando...',
        email: '',
      },
    }

    setNotas((prev) => [temporal, ...prev])
    setValor('')

    startTransition(async () => {
      const response = await crearNotaCliente(clienteId, texto)

      if (response?.error || !response?.nota) {
        setNotas((prev) => prev.filter((item) => item.id !== temporal.id))
        setValor(texto)
        setError(response?.error ?? 'No se pudo guardar la nota')
        return
      }

      setNotas((prev) => [response.nota, ...prev.filter((item) => item.id !== temporal.id)])
    })
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Seguimiento
        </p>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-[var(--border)]">
        {notas.length === 0 ? (
          <div className="p-6 text-[13px] text-[var(--text-3)]">
            Aun no hay notas registradas para este cliente.
          </div>
        ) : (
          notas.map((nota) => (
            <div key={nota.id} className="p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-[12px] font-medium text-[var(--text)]">
                  {nota.usuarios?.nombre || 'Usuario'}
                </p>
                <p className="text-[11px] text-[var(--text-3)]">
                  {formatearFecha(nota.created_at)}
                </p>
              </div>
              <p className="text-[13px] text-[var(--text-2)] leading-relaxed whitespace-pre-wrap">
                {nota.nota}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 space-y-3">
        <Textarea
          placeholder="Agregar nota de seguimiento..."
          rows={3}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-[12px] text-[var(--red)]">{error}</p> : <span />}
          <Button variant="accent" onClick={agregarNota} loading={isPending}>
            Guardar nota
          </Button>
        </div>
      </div>
    </div>
  )
}
