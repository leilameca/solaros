'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  Globe,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { sincronizarUsuarioAutenticado } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type ModoAcceso = 'login' | 'signup'
type PasoAcceso = 'formulario' | 'codigo'

const OTP_COOLDOWN_SEGUNDOS = 60

const BENEFICIOS = [
  '3 meses de prueba gratuita desde el alta',
  'Acceso desde celular para ventas en campo',
  'CRM, cotizaciones, bombeo, electrico y dashboard en un solo lugar',
]

function normalizarErrorAuth(mensaje: string) {
  const texto = mensaje.toLowerCase()

  if (texto.includes('invalid login credentials')) {
    return 'No encontramos una cuenta activa con ese correo.'
  }

  if (texto.includes('email not confirmed')) {
    return 'Confirma el codigo del correo para terminar de entrar.'
  }

  if (texto.includes('provider is not enabled')) {
    return 'Google Auth no esta habilitado aun en Supabase.'
  }

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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContenido />
    </Suspense>
  )
}

function LoginContenido() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [modo, setModo] = useState<ModoAcceso>('login')
  const [paso, setPaso] = useState<PasoAcceso>('formulario')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState(searchParams.get('error') ?? '')
  const [segundosReenvio, setSegundosReenvio] = useState(0)

  const titulo = modo === 'login' ? 'Entrar a SolarOS' : 'Crear cuenta'
  const subtitulo =
    modo === 'login'
      ? 'Accede con un codigo enviado a tu correo o continua con Google.'
      : 'Crea tu cuenta sin contrasena y empieza tu prueba gratuita.'

  const siguienteRuta = modo === 'signup' ? '/configuracion' : '/dashboard'
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (segundosReenvio <= 0) {
      return
    }

    const intervalo = window.setInterval(() => {
      setSegundosReenvio((actual) => (actual <= 1 ? 0 : actual - 1))
    }, 1000)

    return () => window.clearInterval(intervalo)
  }, [segundosReenvio])

  async function solicitarCodigoAcceso() {
    const correo = email.trim().toLowerCase()

    return supabase.auth.signInWithOtp({
      email: correo,
      options: {
        shouldCreateUser: modo === 'signup',
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          siguienteRuta
        )}`,
        data:
          modo === 'signup'
            ? {
                nombre: nombre.trim(),
                rol: 'admin',
              }
            : undefined,
      },
    })
  }

  async function enviarCodigo(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMensaje('')

    if (!email.trim()) {
      setError('Escribe tu correo para continuar.')
      return
    }

    if (modo === 'signup' && !nombre.trim()) {
      setError('Tu nombre es necesario para crear la cuenta.')
      return
    }

    setCargando(true)

    const { error: otpError } = await solicitarCodigoAcceso()

    setCargando(false)

    if (otpError) {
      setError(normalizarErrorAuth(otpError.message))
      return
    }

    setSegundosReenvio(OTP_COOLDOWN_SEGUNDOS)
    setPaso('codigo')
    setMensaje(
      `Te enviamos un codigo a ${email.trim().toLowerCase()}. Escribelo aqui para continuar.`
    )
  }

  async function confirmarCodigo(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMensaje('')

    if (!codigo.trim()) {
      setError('Escribe el codigo recibido por correo.')
      return
    }

    setCargando(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: codigo.trim(),
      type: 'email',
    })

    if (verifyError) {
      setCargando(false)
      setError(normalizarErrorAuth(verifyError.message))
      return
    }

    const resultado = await sincronizarUsuarioAutenticado(nombre.trim())

    setCargando(false)

    if (resultado.error) {
      setError(resultado.error)
      return
    }

    router.push(siguienteRuta)
    router.refresh()
  }

  async function reenviarCodigo() {
    if (segundosReenvio > 0) {
      return
    }

    setError('')
    setMensaje('')
    setCargando(true)

    const { error: otpError } = await solicitarCodigoAcceso()

    setCargando(false)

    if (otpError) {
      setError(normalizarErrorAuth(otpError.message))
      return
    }

    setSegundosReenvio(OTP_COOLDOWN_SEGUNDOS)
    setMensaje(`Enviamos un nuevo codigo a ${email.trim().toLowerCase()}.`)
  }

  async function continuarConGoogle() {
    setError('')
    setMensaje('')
    setCargando(true)

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          siguienteRuta
        )}`,
      },
    })

    if (googleError) {
      setCargando(false)
      setError(normalizarErrorAuth(googleError.message))
    }
  }

  function cambiarModo(nuevoModo: ModoAcceso) {
    setModo(nuevoModo)
    setPaso('formulario')
    setCodigo('')
    setError('')
    setMensaje('')
    setSegundosReenvio(0)
  }

  return (
    <div className="w-full max-w-[1120px] grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch">
      <section className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,#F8F1DF_0%,#FAFAF8_100%)] p-6 sm:p-8 lg:p-10 min-h-[320px]">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[var(--green)]/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-bd)] bg-white/70 px-3 py-1.5 text-[12px] font-medium text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" />
            SaaS para instaladores solares en Republica Dominicana
          </div>

          <div className="space-y-3">
            <h1 className="max-w-[560px] text-[32px] sm:text-[40px] leading-[1.02] font-[300] tracking-[-0.05em] text-[var(--text)]">
              Vende, cotiza y da seguimiento sin perder el ritmo del equipo.
            </h1>
            <p className="max-w-[560px] text-[14px] sm:text-[15px] leading-relaxed text-[var(--text-2)]">
              SolarOS unifica clientes, propuestas, bombeo, electrico, inventario y metricas para que tu operacion comercial funcione bien tanto en oficina como en campo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                Prueba
              </p>
              <p className="mt-2 text-[24px] font-[300] tracking-[-0.04em] text-[var(--text)]">
                3 meses
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-3)]">Sin costo inicial</p>
            </div>
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                Basico
              </p>
              <p className="mt-2 text-[24px] font-[300] tracking-[-0.04em] text-[var(--text)]">
                $10
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-3)]">Incluye bombeo</p>
            </div>
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
                Movil
              </p>
              <p className="mt-2 text-[24px] font-[300] tracking-[-0.04em] text-[var(--text)]">
                100%
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-3)]">Listo para campo</p>
            </div>
          </div>

          <div className="space-y-3">
            {BENEFICIOS.map((beneficio) => (
              <div key={beneficio} className="flex items-center gap-2 text-[13px] text-[var(--text-2)]">
                <BadgeCheck className="h-4 w-4 text-[var(--green)]" />
                <span>{beneficio}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-[0_14px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-[var(--surface-2)] p-1">
              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className={cn(
                  'h-9 px-4 rounded-full text-[13px] font-medium transition-colors',
                  modo === 'login'
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
                )}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => cambiarModo('signup')}
                className={cn(
                  'h-9 px-4 rounded-full text-[13px] font-medium transition-colors',
                  modo === 'signup'
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
                )}
              >
                Crear cuenta
              </button>
            </div>

            <div>
              <h2 className="text-[24px] font-medium tracking-[-0.03em] text-[var(--text)]">
                {titulo}
              </h2>
              <p className="text-[13px] text-[var(--text-3)] mt-1">{subtitulo}</p>
            </div>
          </div>

          {paso === 'formulario' ? (
            <form onSubmit={enviarCodigo} className="space-y-4">
              {modo === 'signup' ? (
                <Input
                  label="Nombre completo"
                  placeholder="Leilany Meca"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  autoComplete="name"
                  required
                />
              ) : null}

              <Input
                label="Correo electronico"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />

              {mensaje ? (
                <p className="text-[12px] text-[var(--blue)] bg-[var(--blue-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {mensaje}
                </p>
              ) : null}

              {error ? (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                loading={cargando}
                className="w-full"
              >
                <Mail className="h-4 w-4" />
                Enviar codigo por correo
              </Button>
            </form>
          ) : (
            <form onSubmit={confirmarCodigo} className="space-y-4">
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-[12px] font-medium text-[var(--text)]">
                  Revisa tu correo
                </p>
                <p className="text-[12px] text-[var(--text-3)] mt-1">
                  Enviamos un codigo de acceso a <span className="font-medium text-[var(--text)]">{email}</span>.
                </p>
              </div>

              <Input
                label="Codigo de verificacion"
                placeholder="123456"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value.replace(/\s/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
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
                    setPaso('formulario')
                    setCodigo('')
                    setError('')
                    setMensaje('')
                    setSegundosReenvio(0)
                  }}
                >
                  <KeyRound className="h-4 w-4" />
                  Cambiar correo
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  loading={cargando}
                  className="flex-1"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Confirmar codigo
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
                  disabled={cargando || segundosReenvio > 0}
                >
                  Reenviar codigo
                </Button>
              </div>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.08em] font-[family-name:var(--font-mono)] text-[var(--text-3)]">
              <span className="bg-[var(--surface)] px-3">o continua con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={continuarConGoogle}
            loading={cargando}
          >
            <Globe className="h-4 w-4" />
            Google
          </Button>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-[12px] font-medium text-[var(--text)]">
              ¿Que pasa despues?
            </p>
            <p className="text-[12px] text-[var(--text-3)] mt-1">
              {modo === 'signup'
                ? 'Al confirmar el codigo entraras directo a Configuracion para crear tu empresa y empezar la prueba gratuita.'
                : 'Si ya tienes empresa, entraras al dashboard. Si es tu primer acceso, te llevaremos a Configuracion.'}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
              Flujo sin contrasena
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="w-full max-w-[1120px] grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch">
      <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,#F8F1DF_0%,#FAFAF8_100%)] min-h-[320px]" />
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] min-h-[520px]" />
    </div>
  )
}
