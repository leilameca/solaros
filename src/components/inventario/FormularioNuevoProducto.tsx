'use client'

import { useMemo, useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProductConfig } from '@/components/inventario/producto-config'
import { crearProductoInventario } from '@/app/(dashboard)/inventario/actions'
import type { CategoriaProducto } from '@/types/inventario'

function aNumeroOpcional(valor: string) {
  if (!valor.trim()) return null
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : null
}

export function FormularioNuevoProducto() {
  const [categoria, setCategoria] = useState<CategoriaProducto>('panel_solar')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [potenciaW, setPotenciaW] = useState('')
  const [potenciaKw, setPotenciaKw] = useState('')
  const [potenciaHp, setPotenciaHp] = useState('')
  const [voltaje, setVoltaje] = useState('')
  const [capacidadKwh, setCapacidadKwh] = useState('')
  const [stockInicial, setStockInicial] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('2')
  const [unidad, setUnidad] = useState('und')
  const [precioCostoUsd, setPrecioCostoUsd] = useState('')
  const [precioVentaUsd, setPrecioVentaUsd] = useState('')
  const [precioRd, setPrecioRd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startSaving] = useTransition()

  const configCategoria = useMemo(() => createProductConfig(categoria), [categoria])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!marca.trim() || !modelo.trim()) {
      setError('Marca y modelo son obligatorios.')
      return
    }

    startSaving(async () => {
      const respuesta = await crearProductoInventario({
        categoria,
        marca,
        modelo,
        descripcion,
        potencia_w: aNumeroOpcional(potenciaW),
        potencia_kw: aNumeroOpcional(potenciaKw),
        potencia_hp: aNumeroOpcional(potenciaHp),
        voltaje: aNumeroOpcional(voltaje),
        capacidad_kwh: aNumeroOpcional(capacidadKwh),
        stock_inicial: Number(stockInicial || '0'),
        stock_minimo: Number(stockMinimo || '0'),
        unidad: unidad.trim() || 'und',
        precio_costo_usd: aNumeroOpcional(precioCostoUsd),
        precio_venta_usd: aNumeroOpcional(precioVentaUsd),
        precio_rd: aNumeroOpcional(precioRd),
      })

      if (respuesta?.error) {
        setError(respuesta.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-28 md:pb-0">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
          Producto
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaProducto)}>
              <SelectTrigger label="Categoria">
                <SelectValue placeholder="Selecciona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {configCategoria.opciones.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input label="Marca" value={marca} onChange={(event) => setMarca(event.target.value)} />
          <Input label="Modelo" value={modelo} onChange={(event) => setModelo(event.target.value)} />
          <div className="md:col-span-2">
            <Textarea
              label="Descripcion"
              rows={3}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Notas tecnicas, serie, observaciones..."
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
          Especificaciones
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {configCategoria.campos.includes('potencia_w') ? (
            <Input
              label="Potencia (W)"
              type="number"
              step="1"
              value={potenciaW}
              onChange={(event) => setPotenciaW(event.target.value)}
            />
          ) : null}
          {configCategoria.campos.includes('potencia_kw') ? (
            <Input
              label="Potencia (kW)"
              type="number"
              step="0.1"
              value={potenciaKw}
              onChange={(event) => setPotenciaKw(event.target.value)}
            />
          ) : null}
          {configCategoria.campos.includes('potencia_hp') ? (
            <Input
              label="Potencia (HP)"
              type="number"
              step="0.1"
              value={potenciaHp}
              onChange={(event) => setPotenciaHp(event.target.value)}
            />
          ) : null}
          {configCategoria.campos.includes('voltaje') ? (
            <Input
              label="Voltaje (V)"
              type="number"
              step="1"
              value={voltaje}
              onChange={(event) => setVoltaje(event.target.value)}
            />
          ) : null}
          {configCategoria.campos.includes('capacidad_kwh') ? (
            <Input
              label="Capacidad (kWh)"
              type="number"
              step="0.1"
              value={capacidadKwh}
              onChange={(event) => setCapacidadKwh(event.target.value)}
            />
          ) : null}
          {configCategoria.campos.includes('unidad') ? (
            <Input
              label="Unidad"
              value={unidad}
              onChange={(event) => setUnidad(event.target.value)}
            />
          ) : null}
          {configCategoria.campos.includes('precio_rd') ? (
            <Input
              label="Precio RD$"
              type="number"
              step="0.01"
              value={precioRd}
              onChange={(event) => setPrecioRd(event.target.value)}
            />
          ) : null}
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)] mb-2">
          Stock y precios
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!configCategoria.campos.includes('unidad') ? (
            <Input
              label="Unidad"
              value={unidad}
              onChange={(event) => setUnidad(event.target.value)}
            />
          ) : null}
          {!configCategoria.campos.includes('precio_rd') ? (
            <Input
              label="Precio RD$"
              type="number"
              step="0.01"
              value={precioRd}
              onChange={(event) => setPrecioRd(event.target.value)}
            />
          ) : null}
          <Input
            label="Stock inicial"
            type="number"
            min="0"
            step="1"
            value={stockInicial}
            onChange={(event) => setStockInicial(event.target.value)}
          />
          <Input
            label="Stock minimo"
            type="number"
            min="0"
            step="1"
            value={stockMinimo}
            onChange={(event) => setStockMinimo(event.target.value)}
          />
          <Input
            label="Precio costo USD"
            type="number"
            step="0.01"
            value={precioCostoUsd}
            onChange={(event) => setPrecioCostoUsd(event.target.value)}
          />
          <Input
            label="Precio venta USD"
            type="number"
            step="0.01"
            value={precioVentaUsd}
            onChange={(event) => setPrecioVentaUsd(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="bg-[var(--red-bg)] border border-[var(--red)] rounded-[var(--radius-sm)] p-3">
          <p className="text-[12px] text-[var(--red)]">{error}</p>
        </div>
      ) : null}

      <div className="hidden md:flex justify-end">
        <Button type="submit" variant="accent" loading={isPending}>
          <Save className="h-3.5 w-3.5" />
          Guardar producto
        </Button>
      </div>

      <div className="md:hidden fixed bottom-[4.75rem] left-0 right-0 z-30 px-4">
        <div className="mx-auto max-w-content rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface)]/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
          <Button type="submit" variant="accent" loading={isPending} className="w-full">
            <Save className="h-3.5 w-3.5" />
            Guardar producto
          </Button>
        </div>
      </div>
    </form>
  )
}
