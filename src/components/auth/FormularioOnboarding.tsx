'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ImagePlus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { completarOnboarding } from '@/app/(auth)/onboarding/actions'

export function FormularioOnboarding({
  empresa,
}: {
  empresa: {
    nombre: string
    precio_wp: number
    tasa_dolar: number
    logo_url: string | null
  }
}) {
  const router = useRouter()
  const [guardando, startTransition] = useTransition()
  const [precioWp, setPrecioWp] = useState(String(empresa.precio_wp))
  const [tasaDolar, setTasaDolar] = useState(String(empresa.tasa_dolar))
  const [logo, setLogo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(empresa.logo_url)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  function handleSeleccionLogo(file: File | null) {
    setLogo(file)

    if (!file) {
      setPreview(empresa.logo_url)
      return
    }

    setPreview(URL.createObjectURL(file))
  }

  function handleSubmit() {
    setError('')

    startTransition(async () => {
      const formData = new FormData()
      formData.set('precio_wp', precioWp)
      formData.set('tasa_dolar', tasaDolar)

      if (logo) {
        formData.set('logo', logo)
      }

      const resultado = await completarOnboarding(formData)

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  const ejemplo5Kwp = 5 * 1000 * Number(precioWp || 0)

  return (
    <div className="w-full max-w-[860px] grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
      <section className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,#EDF7FF_0%,#FAFAF8_100%)] p-6 sm:p-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[var(--border)] px-3 py-1.5 text-[12px] font-medium text-[var(--blue)]">
            <Settings2 className="h-3.5 w-3.5" />
            Onboarding inicial
          </div>

          <div className="space-y-3">
            <h1 className="text-[34px] leading-[1.02] tracking-[-0.05em] font-[300] text-[var(--text)]">
              Termina la puesta en marcha de {empresa.nombre}.
            </h1>
            <p className="text-[14px] text-[var(--text-2)] leading-relaxed">
              Solo necesitamos logo, precio por Wp y tasa del dolar para que puedas empezar a cotizar con la empresa correctamente configurada.
            </p>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
              Ejemplo en tiempo real
            </p>
            <p className="mt-2 text-[24px] font-[300] tracking-[-0.04em] text-[var(--text)]">
              ${new Intl.NumberFormat('en-US').format(ejemplo5Kwp)}
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-3)]">
              Un sistema de 5 KWp con tu precio actual.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
        <div className="space-y-5">
          <div>
            <h2 className="text-[24px] font-medium tracking-[-0.03em] text-[var(--text)]">
              Primeros ajustes
            </h2>
            <p className="text-[13px] text-[var(--text-3)] mt-1">
              Esto se puede cambiar luego desde Configuracion.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-[var(--text-3)]">
                {preview ? (
                  <img src={preview} alt="Logo empresa" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[22px] font-medium">SO</span>
                )}
              </div>
              <label className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-sm)] border border-[var(--border-s)] text-[13px] font-medium text-[var(--text)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                <ImagePlus className="h-4 w-4" />
                Subir logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(event) => handleSeleccionLogo(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <p className="text-[11px] text-[var(--text-3)]">PNG, JPG o WebP. Maximo 2MB.</p>
          </div>

          <Input
            label="Precio por Watt-pico (USD)"
            type="number"
            step="0.01"
            value={precioWp}
            onChange={(event) => setPrecioWp(event.target.value)}
          />
          <Input
            label="Tasa de cambio RD$/USD"
            type="number"
            step="0.01"
            value={tasaDolar}
            onChange={(event) => setTasaDolar(event.target.value)}
          />

          {error ? (
            <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            variant="accent"
            className="w-full"
            loading={guardando}
            onClick={handleSubmit}
          >
            Empezar a usar SolarOS
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}
