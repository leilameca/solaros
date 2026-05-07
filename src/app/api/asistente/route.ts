import Anthropic from '@anthropic-ai/sdk'
import { createClient, obtenerEmpresaId } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `
Eres el asistente de SolarOS, un SaaS para empresas de energía solar en República Dominicana. Tu nombre es Sol.

Puedes ayudar con dos tipos de preguntas:
1. Cómo usar SolarOS (cotizaciones, clientes, inventario, cobros, PDF, etc.)
2. Consultar datos reales de la empresa del usuario

CONOCIMIENTO DEL SISTEMA:
- Módulos: Cotizaciones Solar, Cotizaciones Bombeo, Servicios Eléctricos, CRM Clientes, Inventario, PDF Propuestas, Cobros, Configuración, Dashboard
- Cotizaciones tienen estados: borrador → enviada → aprobada → en_instalacion → completada
- Los planes de cobro se crean cuando una cotización es aprobada
- El inventario tiene alertas de stock mínimo
- Los PDF se generan y se pueden compartir por WhatsApp
- La Ley 57-07 aplica un descuento fiscal del 38% en sistemas solares en RD (distribuido en 3 años)
- Las cotizaciones de bombeo son para sistemas de bombeo de agua con paneles solares
- Los servicios eléctricos cubren instalaciones eléctricas generales

REGLAS DE RESPUESTA:
- Responde siempre en español, tono amigable y profesional
- Sin emojis
- Cuando muestres datos numéricos, usa tablas markdown
- Cuando menciones una cotización o plan de cobro específico, incluye el link en formato markdown
- Si no tienes datos suficientes para responder, dilo claramente
- Respuestas concisas — máximo 3 párrafos para explicaciones del sistema
- Para datos: muestra la tabla primero, explicación después si hace falta
- Nunca inventes datos — solo muestra lo que está en el contexto proporcionado

CONTEXTO DE LA EMPRESA:
Empresa: {empresa_nombre}
Plan: {plan}
Usuario: {usuario_nombre} ({rol})
Página actual: {pagina_actual}
`.trim()

const PALABRAS_DATOS = [
  'cuántas', 'cuántos', 'cuál', 'cuáles', 'muéstrame', 'dime',
  'mis cotizaciones', 'mis clientes', 'mis cobros', 'pendiente',
  'vencido', 'este mes', 'total', 'cuánto debo cobrar',
  'clientes nuevos', 'aprobadas', 'aprobados', 'pipeline', 'inventario',
  'stock', 'última cotización', 'busca', 'encuentra', 'cuánto',
  'resumen', 'facturas', 'pagos', 'cuota',
]

function necesitaDatos(pregunta: string): boolean {
  const lower = pregunta.toLowerCase()
  return PALABRAS_DATOS.some((palabra) => lower.includes(palabra))
}

async function obtenerContextoDatos(pregunta: string, empresaId: string): Promise<string> {
  const supabase = createClient()
  const lower = pregunta.toLowerCase()
  const partes: string[] = []
  const queries: Promise<void>[] = []

  if (lower.includes('cotizaci')) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from('cotizaciones')
          .select('id, numero_cotizacion, estado, total_usd, created_at, clientes(nombre)')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (data?.length) {
          let bloque = '\nCOTIZACIONES SOLARES RECIENTES:\n'
          bloque += data
            .map((c) => {
              const cliente = (c.clientes as unknown as { nombre: string } | null)?.nombre ?? 'Sin cliente'
              return `- ${c.numero_cotizacion} | ${cliente} | $${c.total_usd} USD | ${c.estado} | ID: ${c.id}`
            })
            .join('\n')
          partes.push(bloque)
        }
      })()
    )
  }

  if (lower.includes('cliente')) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from('clientes')
          .select('id, nombre, etapa, provincia')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (data?.length) {
          let bloque = '\nCLIENTES RECIENTES:\n'
          bloque += data
            .map((c) => `- ${c.nombre} | ${c.etapa ?? 'lead'} | ${c.provincia ?? '—'} | ID: ${c.id}`)
            .join('\n')
          partes.push(bloque)
        }
      })()
    )
  }

  if (
    lower.includes('cobro') ||
    lower.includes('pago') ||
    lower.includes('pendiente') ||
    lower.includes('vencido') ||
    lower.includes('cuota')
  ) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from('plan_pago_cuotas')
          .select('id, orden, monto_usd, condicion, fecha_limite, estado, planes_pago(numero_cotizacion, cliente_nombre, id)')
          .eq('empresa_id', empresaId)
          .in('estado', ['pendiente', 'vencido'])
          .order('fecha_limite', { ascending: true })
          .limit(20)

        if (data?.length) {
          let bloque = '\nCOBROS PENDIENTES Y VENCIDOS:\n'
          bloque += data
            .map((c) => {
              const plan = c.planes_pago as unknown as { numero_cotizacion: string; cliente_nombre: string; id: string } | null
              return `- ${plan?.cliente_nombre ?? '—'} | Cuota ${c.orden} | $${c.monto_usd} USD | ${c.estado} | Vence: ${c.fecha_limite ?? 'sin fecha'} | Plan ID: ${plan?.id}`
            })
            .join('\n')
          partes.push(bloque)
        }
      })()
    )
  }

  if (
    lower.includes('inventario') ||
    lower.includes('stock') ||
    lower.includes('panel') ||
    lower.includes('inversor')
  ) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from('inventario')
          .select('marca, modelo, categoria, stock_actual, stock_minimo, precio_venta_usd')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .order('categoria')
          .limit(30)

        if (data?.length) {
          let bloque = '\nINVENTARIO ACTUAL:\n'
          bloque += data
            .map(
              (p) =>
                `- ${p.marca} ${p.modelo} | ${p.categoria} | Stock: ${p.stock_actual} (mín: ${p.stock_minimo ?? 0}) | $${p.precio_venta_usd ?? '—'} USD`
            )
            .join('\n')
          partes.push(bloque)
        }
      })()
    )
  }

  if (
    lower.includes('mes') ||
    lower.includes('resumen') ||
    lower.includes('cuántas') ||
    lower.includes('cuántos') ||
    lower.includes('total')
  ) {
    queries.push(
      (async () => {
        const inicioMes = new Date()
        inicioMes.setDate(1)
        inicioMes.setHours(0, 0, 0, 0)

        const [solar, clientes] = await Promise.all([
          supabase
            .from('cotizaciones')
            .select('estado, total_usd')
            .eq('empresa_id', empresaId)
            .gte('created_at', inicioMes.toISOString()),
          supabase
            .from('clientes')
            .select('id', { count: 'exact', head: true })
            .eq('empresa_id', empresaId)
            .gte('created_at', inicioMes.toISOString()),
        ])

        const cots = solar.data ?? []
        const aprobadas = cots.filter((c) =>
          ['aprobada', 'aprobado', 'en_instalacion', 'completada'].includes(c.estado)
        )
        const valorAprobado = aprobadas.reduce((a, c) => a + (c.total_usd ?? 0), 0)

        let bloque = '\nMÉTRICAS DEL MES ACTUAL:\n'
        bloque += `- Cotizaciones creadas: ${cots.length}\n`
        bloque += `- Clientes nuevos: ${clientes.count ?? 0}\n`
        bloque += `- Aprobadas: ${aprobadas.length}\n`
        bloque += `- Valor aprobado: $${valorAprobado.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD\n`
        partes.push(bloque)
      })()
    )
  }

  await Promise.allSettled(queries)
  return partes.join('\n')
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    const empresaId = await obtenerEmpresaId()
    if (!empresaId) {
      return Response.json({ error: 'Empresa no configurada' }, { status: 400 })
    }

    const body = await req.json()
    const { messages, empresa, usuario, paginaActual } = body

    if (!messages?.length) {
      return Response.json({ error: 'Sin mensajes' }, { status: 400 })
    }

    const ultimaPregunta: string = messages[messages.length - 1]?.content ?? ''

    let contextoDatos = ''
    if (necesitaDatos(ultimaPregunta)) {
      contextoDatos = await obtenerContextoDatos(ultimaPregunta, empresaId)
    }

    const systemPrompt =
      SYSTEM_PROMPT.replace('{empresa_nombre}', empresa?.nombre ?? 'Desconocida')
        .replace('{plan}', empresa?.plan_actual ?? 'basico')
        .replace('{usuario_nombre}', usuario?.nombre ?? 'Usuario')
        .replace('{rol}', usuario?.rol ?? 'admin')
        .replace('{pagina_actual}', paginaActual ?? '/')
      + (contextoDatos ? `\n\nDATOS DISPONIBLES PARA ESTA CONSULTA:\n${contextoDatos}` : '')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const texto =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return Response.json({ respuesta: texto })
  } catch (err) {
    console.error('[asistente]', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
