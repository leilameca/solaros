'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MessageCircle, Send, X } from 'lucide-react'
import { useUsuarioContext } from '@/components/usuario/UsuarioProvider'
import { cn } from '@/lib/utils'

interface Mensaje {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const PREGUNTAS_SUGERIDAS = [
  '¿Cuántas cotizaciones tengo este mes?',
  '¿Qué cobros tengo pendientes?',
  '¿Cómo creo una cotización solar?',
  '¿Qué productos tienen stock bajo?',
  '¿Cómo genero un PDF?',
  '¿Cómo funciona la Ley 57-07?',
]

const MAX_MENSAJES = 10

export function BurbujaAsistente() {
  const { usuario, empresa } = useUsuarioContext()
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [tieneNuevo, setTieneNuevo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    if (abierto) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensajes, cargando, abierto])

  // Focus en el input al abrir
  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 150)
      setTieneNuevo(false)
    }
  }, [abierto])

  async function enviarMensaje(texto: string) {
    const textoLimpio = texto.trim()
    if (!textoLimpio || cargando) return

    const nuevoMensaje: Mensaje = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textoLimpio,
      timestamp: new Date(),
    }

    const historial = [...mensajes, nuevoMensaje].slice(-MAX_MENSAJES)
    setMensajes(historial)
    setInput('')
    setCargando(true)

    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historial.map((m) => ({ role: m.role, content: m.content })),
          empresa: empresa ? { id: empresa.id, nombre: empresa.nombre, plan_actual: empresa.plan_actual } : null,
          usuario: usuario ? { nombre: usuario.nombre, rol: usuario.rol } : null,
          paginaActual: pathname,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) throw new Error(json.error ?? 'Error desconocido')

      const respuesta: Mensaje = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: json.respuesta,
        timestamp: new Date(),
      }

      setMensajes((prev) => [...prev, respuesta])

      if (!abierto) setTieneNuevo(true)
    } catch {
      const mensajeError: Mensaje = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, tuve un problema al procesar tu pregunta. Intenta de nuevo.',
        timestamp: new Date(),
      }
      setMensajes((prev) => [...prev, mensajeError])
    } finally {
      setCargando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje(input)
    }
  }

  function nuevaConversacion() {
    setMensajes([])
    setInput('')
  }

  const mostrarBotonNueva = mensajes.length >= MAX_MENSAJES

  return (
    <>
      {/* Panel de chat */}
      <div
        className={cn(
          'fixed z-50 transition-all duration-200 ease-out',
          // Desktop
          'md:bottom-24 md:right-6 md:w-[380px] md:h-[520px]',
          // Móvil: pantalla completa menos bottom nav
          'inset-x-0 bottom-16 top-0 md:inset-auto',
          abierto
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'
        )}
      >
        <div className="flex flex-col h-full bg-[var(--surface)] border border-[var(--border)] md:rounded-[var(--radius)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex-shrink-0">
            <div>
              <p className="text-[13px] font-medium text-[var(--text)]">Sol</p>
              <p className="text-[11px] text-[var(--text-3)]">Asistente SolarOS</p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-[var(--text-3)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body — mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {mensajes.length === 0 ? (
              /* Estado vacío con sugerencias */
              <div className="flex flex-col gap-4 pt-2">
                <div className="text-center">
                  <p className="text-[13px] font-medium text-[var(--text)]">Hola, soy Sol.</p>
                  <p className="text-[12px] text-[var(--text-3)] mt-0.5">¿En qué puedo ayudarte?</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PREGUNTAS_SUGERIDAS.map((pregunta) => (
                    <button
                      key={pregunta}
                      type="button"
                      onClick={() => enviarMensaje(pregunta)}
                      className="text-left text-[11px] text-[var(--text-2)] bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors leading-snug"
                    >
                      {pregunta}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {mostrarBotonNueva && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={nuevaConversacion}
                      className="text-[11px] text-[var(--accent)] border border-[var(--accent-bd)] bg-[var(--accent-bg)] rounded-full px-3 py-1 hover:bg-[var(--accent)] hover:text-white transition-colors"
                    >
                      Nueva conversación
                    </button>
                  </div>
                )}

                {mensajes.map((m) => (
                  <BurbujaMensaje key={m.id} mensaje={m} />
                ))}

                {cargando && <IndicadorEscribiendo />}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer — input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border)] flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              disabled={cargando}
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border-s)] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => enviarMensaje(input)}
              disabled={!input.trim() || cargando}
              className="flex items-center justify-center h-9 w-9 rounded-[var(--radius-sm)] bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-30 flex-shrink-0"
              aria-label="Enviar"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Burbuja flotante */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          'fixed z-50 flex items-center justify-center rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition-all duration-200 hover:scale-105 active:scale-95',
          'h-[52px] w-[52px]',
          'bg-[var(--accent)]',
          // Desktop
          'bottom-6 right-6',
          // Móvil: encima del bottom nav (64px)
          'md:bottom-6 bottom-20',
          abierto && 'opacity-0 pointer-events-none scale-90'
        )}
        aria-label="Abrir asistente Sol"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {tieneNuevo && (
          <span className="absolute top-0.5 right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-[var(--bg)]" />
        )}
      </button>
    </>
  )
}

function BurbujaMensaje({ mensaje }: { mensaje: Mensaje }) {
  const esUsuario = mensaje.role === 'user'

  return (
    <div className={cn('flex flex-col gap-1', esUsuario ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] px-3 py-2 rounded-[var(--radius)] text-[12px] leading-relaxed',
          esUsuario
            ? 'bg-[var(--accent)] text-white rounded-br-[4px]'
            : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-bl-[4px]'
        )}
      >
        {esUsuario ? (
          <p>{mensaje.content}</p>
        ) : (
          <div className="prose-sol">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="w-full text-[11px] border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead>{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                th: ({ children }) => (
                  <th className="text-left px-2 py-1.5 bg-[var(--surface)] text-[var(--text-3)] font-medium border-b border-[var(--border)] text-[10px] uppercase tracking-[0.06em]">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2 py-1.5 border-b border-[var(--border)] text-[var(--text-2)]">
                    {children}
                  </td>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-[var(--accent)] underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="bg-[var(--surface)] px-1 rounded text-[11px] font-[family-name:var(--font-mono)]">
                    {children}
                  </code>
                ),
                p: ({ children }) => (
                  <p className="mb-1.5 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-[12px]">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-[var(--text)]">{children}</strong>
                ),
              }}
            >
              {mensaje.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <p className="text-[10px] text-[var(--text-3)] px-1">
        {mensaje.timestamp.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}

function IndicadorEscribiendo() {
  return (
    <div className="flex items-start">
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] rounded-bl-[4px] px-3 py-2.5">
        <div className="flex gap-1 items-center">
          <div className="w-1.5 h-1.5 bg-[var(--text-3)] rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 bg-[var(--text-3)] rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 bg-[var(--text-3)] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
