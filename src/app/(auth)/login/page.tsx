'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Globe,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { sincronizarUsuarioAutenticado } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type ModoAcceso = 'login' | 'signup'
type PasoAcceso = 'formulario' | 'codigo'

const OTP_COOLDOWN_SEGUNDOS = 60

function normalizarErrorAuth(mensaje: string) {
  const texto = mensaje.toLowerCase()
  if (texto.includes('invalid login credentials'))
    return 'No encontramos una cuenta activa con ese correo.'
  if (texto.includes('email not confirmed'))
    return 'Confirma el código del correo para terminar de entrar.'
  if (texto.includes('provider is not enabled'))
    return 'Google Auth no está habilitado aún en Supabase.'
  if (
    texto.includes('security purposes') ||
    texto.includes('too many requests') ||
    texto.includes('rate limit') ||
    texto.includes('429')
  )
    return 'Ya enviamos un código hace poco. Espera un momento y vuelve a intentarlo.'
  if (texto.includes('otp'))
    return 'El código no es válido o ya venció. Solicita uno nuevo.'
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
      ? 'Accede con un código enviado a tu correo o continúa con Google.'
      : 'Crea tu cuenta sin contraseña y empieza tu prueba gratuita.'

  const siguienteRuta = modo === 'signup' ? '/configuracion' : '/dashboard'
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (segundosReenvio <= 0) return
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(siguienteRuta)}`,
        data:
          modo === 'signup'
            ? { nombre: nombre.trim(), rol: 'admin' }
            : undefined,
      },
    })
  }

  async function enviarCodigo(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMensaje('')
    if (!email.trim()) { setError('Escribe tu correo para continuar.'); return }
    if (modo === 'signup' && !nombre.trim()) {
      setError('Tu nombre es necesario para crear la cuenta.')
      return
    }
    setCargando(true)
    const { error: otpError } = await solicitarCodigoAcceso()
    setCargando(false)
    if (otpError) { setError(normalizarErrorAuth(otpError.message)); return }
    setSegundosReenvio(OTP_COOLDOWN_SEGUNDOS)
    setPaso('codigo')
    setMensaje(`Te enviamos un código a ${email.trim().toLowerCase()}. Escríbelo aquí para continuar.`)
  }

  async function confirmarCodigo(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMensaje('')
    if (!codigo.trim()) { setError('Escribe el código recibido por correo.'); return }
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
    if (resultado.error) { setError(resultado.error); return }
    router.push(siguienteRuta)
    router.refresh()
  }

  async function reenviarCodigo() {
    if (segundosReenvio > 0) return
    setError('')
    setMensaje('')
    setCargando(true)
    const { error: otpError } = await solicitarCodigoAcceso()
    setCargando(false)
    if (otpError) { setError(normalizarErrorAuth(otpError.message)); return }
    setSegundosReenvio(OTP_COOLDOWN_SEGUNDOS)
    setMensaje(`Enviamos un nuevo código a ${email.trim().toLowerCase()}.`)
  }

  async function continuarConGoogle() {
    setError('')
    setMensaje('')
    setCargando(true)
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(siguienteRuta)}`,
      },
    })
    if (googleError) { setCargando(false); setError(normalizarErrorAuth(googleError.message)) }
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
    <div className="w-full max-w-[1060px] grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0 rounded-[20px] overflow-hidden border border-[rgba(255,255,255,0.06)] shadow-[0_32px_80px_rgba(0,0,0,0.28)]">

      {/* ── Panel izquierdo ── */}
      <section className="flex flex-col justify-between bg-[#0D0D0D] px-8 py-9 sm:px-10 sm:py-10 lg:px-12 lg:py-12 min-h-[360px]">
        {/* Marca */}
        <p className="text-[13px] font-medium tracking-[0.04em] text-[#F59E0B]">
          SolarOS
        </p>

        {/* Contenido central */}
        <div className="py-8 space-y-5">
          <h1 className="max-w-[480px] text-[34px] sm:text-[44px] leading-[1.05] font-[350] tracking-[-0.04em] text-white">
            Cotizaciones, clientes y cobros. Todo el negocio solar.
          </h1>
          <div className="space-y-2 pt-1">
            {[
              'Cotizaciones solares, bombeo y eléctricas',
              'Seguimiento de proyectos con estado y alertas',
              'Planes de cobro y registro de pagos',
              'Inventario y métricas en tiempo real',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-px w-3 bg-[#444] flex-shrink-0" />
                <p className="text-[13px] leading-snug text-[#888]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] tracking-[0.03em] text-[#333]">
          República Dominicana · 3 meses de prueba gratuita
        </p>
      </section>

      {/* ── Panel derecho — formulario ── */}
      <section className="bg-[var(--surface)] border-l border-[var(--border)] px-6 py-8 sm:px-8 flex flex-col">
        <div className="flex flex-col gap-5 flex-1">
          {/* Toggle modo */}
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-[var(--surface-2)] p-1 border border-[var(--border)]">
              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className={cn(
                  'h-8 px-4 rounded-full text-[13px] font-medium transition-all',
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
                  'h-8 px-4 rounded-full text-[13px] font-medium transition-all',
                  modo === 'signup'
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
                )}
              >
                Crear cuenta
              </button>
            </div>

            <div>
              <h2 className="text-[20px] font-medium tracking-[-0.02em] text-[var(--text)]">
                {titulo}
              </h2>
              <p className="text-[13px] text-[var(--text-3)] mt-0.5 leading-snug">{subtitulo}</p>
            </div>
          </div>

          {/* Formulario */}
          {paso === 'formulario' ? (
            <form onSubmit={enviarCodigo} className="space-y-4">
              {modo === 'signup' ? (
                <Input
                  label="Nombre completo"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  required
                />
              ) : null}

              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {mensaje && (
                <p className="text-[12px] text-[var(--blue)] bg-[var(--blue-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {mensaje}
                </p>
              )}
              {error && (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {error}
                </p>
              )}

              <Button type="submit" variant="accent" size="lg" loading={cargando} className="w-full">
                <Mail className="h-4 w-4" />
                Enviar código por correo
              </Button>
            </form>
          ) : (
            <form onSubmit={confirmarCodigo} className="space-y-4">
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-[12px] font-medium text-[var(--text)]">Revisa tu correo</p>
                <p className="text-[12px] text-[var(--text-3)] mt-1">
                  Enviamos un código a{' '}
                  <span className="font-medium text-[var(--text)]">{email}</span>.
                </p>
              </div>

              <Input
                label="Código de verificación"
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\s/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center font-[family-name:var(--font-mono)] tracking-[0.3em] text-[18px]"
                required
              />

              {error && (
                <p className="text-[12px] text-[var(--red)] bg-[var(--red-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {error}
                </p>
              )}
              {mensaje && (
                <p className="text-[12px] text-[var(--blue)] bg-[var(--blue-bg)] px-3 py-2 rounded-[var(--radius-sm)]">
                  {mensaje}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setPaso('formulario'); setCodigo(''); setError(''); setMensaje(''); setSegundosReenvio(0) }}
                >
                  <KeyRound className="h-4 w-4" />
                  Cambiar correo
                </Button>
                <Button type="submit" variant="accent" loading={cargando} className="flex-1">
                  <ShieldCheck className="h-4 w-4" />
                  Confirmar código
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-[var(--text-3)]">
                  {segundosReenvio > 0
                    ? `Puedes solicitar otro código en ${segundosReenvio}s.`
                    : 'Si no llegó el correo, puedes reenviar uno ahora.'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start px-0 text-[13px] text-[var(--accent)] hover:bg-transparent hover:text-[var(--accent)]"
                  onClick={reenviarCodigo}
                  disabled={cargando || segundosReenvio > 0}
                >
                  Reenviar código
                </Button>
              </div>
            </form>
          )}

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.08em] font-[family-name:var(--font-mono)] text-[var(--text-3)]">
              <span className="bg-[var(--surface)] px-3">o continúa con</span>
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

          {/* Info */}
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-[12px] font-medium text-[var(--text)]">¿Qué pasa después?</p>
            <p className="text-[12px] text-[var(--text-3)] mt-1 leading-relaxed">
              {modo === 'signup'
                ? 'Al confirmar el código entrarás directo a Configuración para crear tu empresa y empezar la prueba gratuita.'
                : 'Si ya tienes empresa, entrarás al dashboard. Si es tu primer acceso, te llevaremos a Configuración.'}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
              Flujo sin contraseña
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
    <div className="w-full max-w-[1060px] grid grid-cols-1 lg:grid-cols-[1fr_400px] rounded-[20px] overflow-hidden border border-[rgba(255,255,255,0.06)]">
      <div className="bg-[#0D0D0D] min-h-[360px]" />
      <div className="bg-[var(--surface)] min-h-[520px]" />
    </div>
  )
}
