import { formatearNumero } from '@/lib/calculos'
import type { CotizacionBombeo, TipoBomba, TipoSistemaBombeo } from '@/types/bombeo'

const ETIQUETAS_SISTEMA_BOMBEO: Record<TipoSistemaBombeo, string> = {
  solar_directo: 'Solar directo',
  solar_vfd: 'Solar con VFD',
  electrico: 'Electrico',
}

const ETIQUETAS_BOMBA: Record<TipoBomba, string> = {
  sumergible: 'Sumergible',
  superficial: 'Superficial',
}

export function ResumenTecnico({
  cotizacion,
}: {
  cotizacion: CotizacionBombeo
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-2.5 border-b border-[var(--border)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
          Resumen tecnico
        </p>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Info label="Sistema" value={ETIQUETAS_SISTEMA_BOMBEO[cotizacion.tipo_sistema]} />
        <Info label="Bomba" value={ETIQUETAS_BOMBA[cotizacion.tipo_bomba]} />
        <Info label="Provincia" value={cotizacion.provincia ?? 'No aplica'} />
        <Info label="Cliente" value={cotizacion.clientes?.nombre ?? 'Sin cliente'} />
        <InfoMono label="Potencia" value={cotizacion.potencia_hp} unit="HP" />
        <InfoMono label="Potencia electrica" value={cotizacion.potencia_kw} unit="kW" />
        <InfoMono label="Caudal" value={cotizacion.caudal_m3h} unit="m3/h" />
        <InfoMono label="Altura descarga" value={cotizacion.altura_descarga_m} unit="m" />
        <InfoMono
          label="Profundidad pozo"
          value={cotizacion.profundidad_m ?? 0}
          unit="m"
          noAplica={cotizacion.tipo_bomba === 'superficial'}
        />
        <InfoMono label="Litros requeridos" value={cotizacion.litros_dia_requeridos} unit="L/dia" />
        <InfoMono label="Litros disponibles" value={cotizacion.litros_disponibles ?? 0} unit="L/dia" />
        <InfoMono
          label="KWp requerido"
          value={cotizacion.kwp_necesario ?? 0}
          unit="KWp"
          noAplica={cotizacion.tipo_sistema === 'electrico'}
        />
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-[var(--text-3)]">{label}</span>
      <span className="text-[12px] font-medium text-[var(--text)] text-right">{value}</span>
    </div>
  )
}

function InfoMono({
  label,
  value,
  unit,
  noAplica,
}: {
  label: string
  value: number
  unit: string
  noAplica?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-[var(--text-3)]">{label}</span>
      <span className="font-[family-name:var(--font-mono)] text-[12px] font-medium text-[var(--text)] text-right">
        {noAplica ? 'No aplica' : `${formatearNumero(value, 2)} ${unit}`}
      </span>
    </div>
  )
}
