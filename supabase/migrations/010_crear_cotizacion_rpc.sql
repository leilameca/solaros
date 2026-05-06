-- ============================================================
-- SolarOS — RPC atómica para crear cotización solar
-- Inserta cotizacion + consumo_mensual en una sola transacción.
-- Si el insert de consumo falla, el insert de cotización se
-- revierte automáticamente (comportamiento PL/pgSQL por defecto).
-- ============================================================

CREATE OR REPLACE FUNCTION public.crear_cotizacion_con_consumo(
  p_empresa_id         UUID,
  p_cliente_id         UUID,
  p_numero_cotizacion  TEXT,
  p_tipo_sistema       TEXT,
  p_provincia          TEXT,
  p_tarifa             TEXT,
  p_kwh_mensual        NUMERIC,
  p_horas_sol          NUMERIC,
  p_kwp_calculado      NUMERIC,
  p_generacion_mensual NUMERIC,
  p_generacion_anual   NUMERIC,
  p_panel_marca        TEXT,
  p_panel_modelo       TEXT,
  p_panel_potencia_w   INTEGER,
  p_panel_cantidad     INTEGER,
  p_inversor_marca     TEXT,
  p_inversor_modelo    TEXT,
  p_inversor_kw        NUMERIC,
  p_inversor_cantidad  INTEGER,
  p_precio_wp          NUMERIC,
  p_total_usd          NUMERIC,
  p_ley_5707_activa    BOOLEAN,
  p_inversion_neta_usd NUMERIC,
  p_retorno_con_ley    NUMERIC,
  p_retorno_sin_ley    NUMERIC,
  p_ahorro_mensual_rd  NUMERIC,
  p_ahorro_anual_usd   NUMERIC,
  p_tasa_dolar         NUMERIC,
  p_notas              TEXT,
  p_created_by         UUID,
  p_consumo_mensual    JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.cotizaciones (
    empresa_id, cliente_id, numero_cotizacion, tipo_sistema, provincia, tarifa,
    kwh_mensual, horas_sol, kwp_calculado, generacion_mensual, generacion_anual,
    panel_marca, panel_modelo, panel_potencia_w, panel_cantidad,
    inversor_marca, inversor_modelo, inversor_kw, inversor_cantidad,
    precio_wp, total_usd, ley_5707_activa, inversion_neta_usd,
    retorno_con_ley, retorno_sin_ley, ahorro_mensual_rd, ahorro_anual_usd,
    tasa_dolar, estado, notas, created_by
  ) VALUES (
    p_empresa_id, p_cliente_id, p_numero_cotizacion, p_tipo_sistema, p_provincia, p_tarifa,
    p_kwh_mensual, p_horas_sol, p_kwp_calculado, p_generacion_mensual, p_generacion_anual,
    p_panel_marca, p_panel_modelo, p_panel_potencia_w, p_panel_cantidad,
    p_inversor_marca, p_inversor_modelo, p_inversor_kw, p_inversor_cantidad,
    p_precio_wp, p_total_usd, p_ley_5707_activa, p_inversion_neta_usd,
    p_retorno_con_ley, p_retorno_sin_ley, p_ahorro_mensual_rd, p_ahorro_anual_usd,
    p_tasa_dolar, 'borrador', p_notas, p_created_by
  )
  RETURNING id INTO v_id;

  INSERT INTO public.cotizacion_consumo_mensual (cotizacion_id, mes, consumo_kwh, generacion_kwh)
  SELECT
    v_id,
    (item ->> 'mes')::INTEGER,
    (item ->> 'consumo_kwh')::NUMERIC,
    (item ->> 'generacion_kwh')::NUMERIC
  FROM jsonb_array_elements(p_consumo_mensual) AS item;

  RETURN v_id;
END;
$$;
