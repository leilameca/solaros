'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Correo o contraseña incorrectos.')
      setCargando(false)
      return
    }

    router.push('/cotizaciones')
    router.refresh()
  }

  return (
    <div className="w-full max-w-[360px]">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
        <div className="mb-6">
          <h1 className="text-[18px] font-medium text-[var(--text)] tracking-[-0.02em]">
            Iniciar sesión
          </h1>
          <p className="text-[13px] text-[var(--text-3)] mt-1">
            Accede a tu cuenta de SolarOS
          </p>
        </div>

        <form onSubmit={iniciarSesion} className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-sm">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="accent"
            size="lg"
            loading={cargando}
            className="w-full mt-1"
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
