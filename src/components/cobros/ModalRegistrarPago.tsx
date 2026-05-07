'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { registrarPago } from '@/app/(dashboard)/cobros/actions'
import { ETIQUETAS_METODO_PAGO } from '@/types/cobros'
import type { MetodoPago } from '@/types/cobros'

const METODOS: MetodoPago[] = [
  'transferencia_bhd',
  'transferencia_banreservas',
  'transferencia_popular',
  'efectivo',
  'cheque',
  'otro',
]

interface Props {
  cuotaId: string
  planId: string
  empresaId: string
  montoUsd: number
  condicion: string
  orden: number
}

export function ModalRegistrarPago({
  cuotaId,
  planId,
  empresaId,
  montoUsd,
  condicion,
  orden,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [metodo, setMetodo] = useState<MetodoPago>('transferencia_bhd')
  const [referencia, setReferencia] = useState('')
  const [monto, setMonto] = useState<number | ''>(montoUsd)
  const [notas, setNotas] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCerrar() {
    if (isPending) return
    setOpen(false)
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!monto || Number(monto) <= 0) {
      setError('El monto recibido debe ser mayor a cero.')
      return
    }

    startTransition(async () => {
      let comprobante_url: string | undefined

      if (archivo) {
        const supabase = createClient()
        const ext = archivo.name.split('.').pop() ?? 'jpg'
        const ruta = `${empresaId}/${planId}/${cuotaId}.${ext}`
        const { data: uploadData } = await supabase.storage
          .from('comprobantes')
          .upload(ruta, archivo, { upsert: true })
        if (uploadData) {
          comprobante_url = uploadData.path
        }
      }

      const result = await registrarPago({
        cuota_id: cuotaId,
        fecha_pago: fecha,
        metodo_pago: metodo,
        referencia_pago: referencia.trim() || undefined,
        monto_recibido_usd: Number(monto),
        comprobante_url,
        notas_pago: notas.trim() || undefined,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      toast.success(
        `Pago de ${Number(monto).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })} USD registrado correctamente`
      )
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
        Registrar pago
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div
            className="absolute inset-0"
            onClick={handleCerrar}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-[480px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <p className="text-[14px] font-medium text-[var(--text)]">
                  Registrar pago — Cuota {orden}
                </p>
                <p className="text-[12px] text-[var(--text-3)] mt-0.5">{condicion}</p>
              </div>
              <button
                type="button"
                onClick={handleCerrar}
                className="flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-[var(--text-3)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--text-3)] mb-1 block">
                    Fecha de pago
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                    className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-3)] mb-1 block">
                    Monto recibido (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) =>
                      setMonto(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    required
                    className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] font-[family-name:var(--font-mono)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-3)] mb-1 block">
                  Método de pago
                </label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value as MetodoPago)}
                  className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  {METODOS.map((m) => (
                    <option key={m} value={m}>
                      {ETIQUETAS_METODO_PAGO[m]}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Referencia / N° de transferencia (opcional)"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="BHD-0012345…"
              />

              <div>
                <label className="text-[11px] text-[var(--text-3)] mb-1 block">
                  Comprobante (imagen, opcional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="w-full text-[12px] text-[var(--text-2)] file:mr-3 file:py-1 file:px-3 file:rounded-sm file:border file:border-[var(--border-s)] file:text-[12px] file:font-medium file:bg-[var(--surface-2)] file:text-[var(--text)] hover:file:bg-[var(--surface)] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-3)] mb-1 block">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones adicionales…"
                  rows={2}
                  className="w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCerrar}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  loading={isPending}
                  className="flex-1"
                >
                  Confirmar pago recibido
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
