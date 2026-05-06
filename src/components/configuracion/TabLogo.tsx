'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'

export function TabLogo({
  logoUrlInicial,
  disabled,
  onFileChange,
}: {
  logoUrlInicial: string | null
  disabled?: boolean
  onFileChange: (file: File | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(logoUrlInicial)

  useEffect(() => {
    setPreview(logoUrlInicial)
  }, [logoUrlInicial])

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    onFileChange(file)

    if (!file) {
      setPreview(logoUrlInicial)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
  }

  return (
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
          Cambiar logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            disabled={disabled}
            onChange={handleChange}
          />
        </label>
      </div>
      <p className="text-[11px] text-[var(--text-3)]">
        PNG, JPG o WebP. Maximo 2MB.
      </p>
    </div>
  )
}
