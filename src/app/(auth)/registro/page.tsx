'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Building2, Mail, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { PROVINCIAS_RD } from '@/lib/constants'
import { crearEmpresaRegistro } from '@/app/(auth)/registro/actions'
import { sincronizarUsuarioAutenticado } from '@/app/(auth)/login/actions'

type PasoRegistro = 1 | 2 | 3

const OTP_COOLDOWN_SEGUNDOS = 60

function normalizarErrorAuth(mensaje: string) {
  const texto = mensaje.toLowerCase()

  if (
    texto.includes('security purposes') ||
    texto.includes('too many requests') ||
    texto.includes('rate limit') ||
    texto.includes('429')
  ) {
    return 'Ya enviamos un codigo hace poco. Espera un momento y vuelve a intentarlo.'
  }

  if (texto.includes('otp')) {
    return 'El codigo no es valido o ya vencio. Solicita uno nuevo.'
  }

  return mensaje
}

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [paso, setPaso] = useState<PasoRegistro>(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [segundosReenvio, setSegundosReenvio] = useState(0)

  const [form, setForm] = useState({
    nombreEmpresa: '',
    rnc: '',
    provincia: '',
    telefonoEmpresa: '',
    emailEmpresa: '',
    nombreAdmin: '',
    emailAdmin: '',
    codigo: '',
  })

  useEffect(() => {
    if (segundosReenvio <= 0) {
      return
    }

    const intervalo = window.setInterval(() => {
      setSegundosReenvio((actual) => (actual <= 1 ? 0 : actual - 1))
    }, 1000)

    return () => window.clearInterval(intervalo)
  }, [segundosReenvio])

  function actualizar<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function solicitarCodigoAcceso(empresaObjetivoId: string) {
    return supabase.auth.signInWithOtp({
      email: form.emailAdmin.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/onboarding')}`,
        data: {
          empresa_id: empresaObjetivoId,
          nombre: form.nombreAdmin.trim(),
          rol: 'admin',
        },
      },
    })
  }

  async function avanzarEmpresa(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!form.nombreEmpresa.trim()) {
      setError('El nombre de la empresa es obligatorio.')
      return
    }

    setPaso(2)
  }

  async function enviarCodigo(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMensaje('')

    if (!form.nombreAdmin.trim()) {
      setError('El nombre del administrador es obligatorio.')
      return
    }

    if (!form.emailAdmin.trim()) {
      setError('El correo del administrador es obligatorio.')
      return
    }

    setCargando(true)

    let empresaCreadaId = empresaId

    if (!empresaCreadaId) {
      const resultadoEmpresa = await crearEmpresaRegistro({
        nombreEmpresa: form.nombreEmpresa,
        rnc: form.rnc,
        provincia: form.provincia,
        telefono: form.telefonoEmpresa,
        emailEmpresa: form.emailEmpresa,
      })

      if (resultadoEmpresa.error || !resultadoEmpresa.empresaId) {
        setCargando(false)
        setError(resultadoEmpresa.error ?? 'No se pudo crear la empresa.')
        return
      }

      empresaCreadaId = resultadoEmpresa.empresaId
      setEmpresaId(empresaCreadaId)
    }

    if (!empresaCreadaId) {
      setCargando(false)
      setError('No pudimos preparar la empresa para enviar el codigo.')
      return
    }

    const { error: otpError } = await solicitarCodigoAcceso(empresaCreadaId)

    setCargando(false)

    if (otpError) {
      setError(normalizarErrorAuth(otpError.message))
      return
    }

    setSegundosReenvio(OTP_COOLDOWN_SEGUNDOS)
    setPaso(3)
    setMensaje(`Te enviamos un codigo a ${form.emailAdmin.trim().toLowerCase()}.`)
  }

  async function confirmarCodigo(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!form.codigo.trim()) {
      setError('Escribe el codigo del correo.')
      return
    }

    setCargando(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: form.emailAdmin.trim().toLowerCase(),
      token: form.codigo.trim(),
      type: 'email',
    })

    if (verifyError) {
      setCargando(false)
      setError(normalizarErrorAuth(verifyError.message))
      return
    }

    const resultado = await sincronizarUsuarioAutenticado(form.nombreAdmin.trim())

    setCargando(false)

    if (resultado.error) {
      setError(resultado.error)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  async function reenviarCodigo() {
    if (!empresaId || segundosReenvio > 0) {
      return
    }

    setError('')
    setMensaje('')
    setCargando(true)

    const { error: otpError } = await solicitarCodigoAcceso(empresaId)

    setCargando(false)

    if (otpError) {
      setError(normalizarErrorAuth(otpError.message))
      return
    }

    setSegundosReenvio(OTP_COOLDOWN_SEGUNDOS)
    setMensaje(`Enviamos un nuevo codigo a ${form.emailAdmin.trim().toLowerCase()}.`)
  }

  return (
    <div className="w-full max-w-[960px] grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-6 items-start">
      <section className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,#FDF3DC_0%,#FAFAF8_100%)] p-6 sm:p-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[var(--accent-bd)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Prueba gratuita de 3 meses
          </div>

          <div className="space-y-3">
            <h1 className="text-[34px] leading-[1.02] tracking-[-0.05em] font-[300] text-[var(--text)]">
              Registra tu empresa y entra a SolarOS sin contrasena.
            </h1>
            <p className="text-[14px] text-[var(--text-2)] leading-relaxed">
              Crea la empresa, valida el correo del administrador con codigo y termina el onboarding en un flujo corto.
            </p>
          </div>

          <div className="space-y-3">
            <PasoVisual numero={1} activo={paso === 1} titulo="Datos de empresa" />
            <PasoVisual numero={2} activo={paso === 2} titulo="Cuenta administradora" />
            <PasoVisual numero={3} activo={paso === 3} titulo="Codigo y onboarding" />
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
              Plan inicial
            </p>
            <p className="mt-2 text-[24px] font-[300] tracking-[-0.04em] text-[var(--text)]">
              Basico · $10
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-3)]">
              Incluye bombeo, hasta 50 cotizaciones y 50 propuestas al mes.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-medium tracking-[-0.03em] text-[var(--text)]">
                Crear empresa
              </h2>
              <p className="text-[13px] text-[var(--text-3)] mt-1">
                Paso {paso} de 3
              </p>
            </div>
            <Link href="/login" className="text-[13px] text-[var(--text-3)] hover:text-[var(--text)]">
              Ya tengo cuenta
            </Link>
          </div>

          {paso === 1 ? (
            <form onSubmit={avanzarEmpresa} className="space-y-4">
              <Input
                label="Nombre de la empresa"
                value={form.nombreEmpresa}
                onChange={(event) => actualizar('nombreEmpresa', event.target.value)}
                placeholder="SolarTech RD"
                required
              />
              <Input
                label="RNC"
                value={form.rnc}
                onChange={(event) => actualizar('rnc', event.target.value)}
                placeholder="1-31-00000-0"
              />
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Provincia</label>
                <Select
                  value={form.provincia || undefined}
                  onValueChange={(valor) => actualizar('provincia', valor)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCIAS_RD.map((provincia) => (
                      <SelectItem key={provincia} value={provincia}>
                        {provincia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Telefono de la empresa"
                value={form.telefonoEmpresa}
                onChange={(event) => actualizar('telefonoEmpresa', event.target.value)}
                placeholder="809-555-0101"
              />
              <Input
                label="Email de la empresa"
                type="email"
                value={form.emailEmpresa}
                onChange={(event) => actualizar('emailEmpresa', event.target.value)}
                placeholder="ventas@empresa.com"
              />

              {error ? (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {error}
                </p>
              ) : null}

              <Button type="submit" variant="accent" className="w-full">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : null}

          {paso === 2 ? (
            <form onSubmit={enviarCodigo} className="space-y-4">
              <Input
                label="Nombre completo del admin"
                value={form.nombreAdmin}
                onChange={(event) => actualizar('nombreAdmin', event.target.value)}
                placeholder="Leilany Meca"
                required
              />
              <Input
                label="Correo del admin"
                type="email"
                value={form.emailAdmin}
                onChange={(event) => actualizar('emailAdmin', event.target.value)}
                placeholder="admin@empresa.com"
                required
              />

              {error ? (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={() => setPaso(1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <Button type="submit" variant="accent" className="flex-1" loading={cargando}>
                  <Mail className="h-4 w-4" />
                  Enviar codigo
                </Button>
              </div>
            </form>
          ) : null}

          {paso === 3 ? (
            <form onSubmit={confirmarCodigo} className="space-y-4">
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-[12px] font-medium text-[var(--text)]">Revisa tu correo</p>
                <p className="text-[12px] text-[var(--text-3)] mt-1">
                  {mensaje || `Te enviamos un codigo a ${form.emailAdmin}.`}
                </p>
              </div>

              <Input
                label="Codigo de verificacion"
                value={form.codigo}
                onChange={(event) =>
                  actualizar('codigo', event.target.value.replace(/\s/g, '').slice(0, 6))
                }
                placeholder="123456"
                inputMode="numeric"
                className="text-center font-[family-name:var(--font-mono)] tracking-[0.3em] text-[18px]"
                required
              />

              {error ? (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {error}
                </p>
              ) : null}

              {mensaje ? (
                <p className="text-[12px] text-[var(--blue)] bg-[var(--blue-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {mensaje}
                </p>
              ) : null}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPaso(2)
                    setSegundosReenvio(0)
                    setMensaje('')
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <Button type="submit" variant="accent" className="flex-1" loading={cargando}>
                  <ShieldCheck className="h-4 w-4" />
                  Confirmar y continuar
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-[var(--text-3)]">
                  {segundosReenvio > 0
                    ? `Puedes solicitar otro codigo en ${segundosReenvio}s.`
                    : 'Si no llego el correo, puedes reenviar otro codigo ahora.'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start px-0 text-[13px] text-[var(--accent)] hover:bg-transparent hover:text-[var(--accent)]"
                  onClick={reenviarCodigo}
                  disabled={cargando || segundosReenvio > 0 || !empresaId}
                >
                  Reenviar codigo
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function PasoVisual({
  numero,
  activo,
  titulo,
}: {
  numero: number
  activo: boolean
  titulo: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium ${
          activo ? 'bg-[var(--text)] text-[var(--bg)]' : 'bg-white text-[var(--text-3)] border border-[var(--border)]'
        }`}
      >
        {numero}
      </div>
      <div>
        <p className="text-[13px] font-medium text-[var(--text)]">{titulo}</p>
      </div>
    </div>
  )
}
