export const MENSAJE_EMPRESA_NO_CONFIGURADA =
  'Tu usuario no esta asociado a una empresa. Completa la configuracion inicial para activarla.'

export function normalizarErrorSupabase(mensaje?: string | null) {
  if (!mensaje) {
    return 'No se pudo guardar la informacion.'
  }

  const texto = mensaje.toLowerCase()

  if (
    texto.includes('cotizaciones_bombeo') ||
    texto.includes('generar_numero_cotizacion_bombeo')
  ) {
    return 'Falta aplicar la migracion 002_bombeo.sql en Supabase.'
  }

  if (
    texto.includes('whatsapp') ||
    texto.includes('etapa_pipeline') ||
    texto.includes('cliente_notas') ||
    texto.includes('historial_cliente')
  ) {
    return 'Falta aplicar la migracion 003_clientes_crm.sql en Supabase.'
  }

  if (texto.includes('ultimas_cotizaciones')) {
    return 'Falta aplicar la migracion 004_dashboard.sql en Supabase.'
  }

  if (
    texto.includes('color_primario') ||
    texto.includes('terminos_pdf') ||
    texto.includes('trial_ends_at') ||
    texto.includes('suscripcion_estado') ||
    texto.includes('cargo_representante') ||
    texto.includes('stripe_customer_id')
  ) {
    return 'Falta aplicar la migracion 006_configuracion.sql en Supabase.'
  }

  if (
    texto.includes('inventario_movimientos') ||
    texto.includes('stock_actual') ||
    texto.includes('stock_minimo') ||
    texto.includes('precio_costo_usd') ||
    texto.includes('precio_venta_usd') ||
    texto.includes('inventario_stock_bajo')
  ) {
    return 'Falta aplicar la migracion 008_inventario.sql en Supabase.'
  }

  if (
    texto.includes('does not exist') ||
    texto.includes('could not find') ||
    texto.includes('schema cache')
  ) {
    return 'La base de datos no esta actualizada. Aplica las migraciones pendientes en Supabase.'
  }

  if (texto.includes('row-level security') || texto.includes('permission denied')) {
    return 'Tu usuario no tiene permisos para esta operacion o no pertenece a una empresa valida.'
  }

  return mensaje
}
