'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ETIQUETAS_ROL_USUARIO,
  LIMITE_USUARIOS,
  VARIANTES_ROL_USUARIO,
} from '@/lib/configuracion'
import {
  actualizarUsuarioEmpresa,
  invitarUsuarioEmpresa,
} from '@/app/(dashboard)/configuracion/actions'
import { BloqueoConfiguracionInicial } from '@/components/configuracion/BloqueoConfiguracionInicial'
import { cn } from '@/lib/utils'
import type {
  EmpresaConfiguracion,
  FeedbackConfiguracion,
  PlanSuscripcionEmpresa,
  RolUsuarioEmpresa,
  UsuarioActualConfiguracion,
  UsuarioEmpresa,
} from '@/types/configuracion'

export function TabUsuarios({
  empresa,
  usuarioActual,
  usuariosIniciales,
  modoInicial,
  usuariosActivos,
  limiteUsuarios,
  onDirtyChange,
  onFeedback,
}: {
  empresa: EmpresaConfiguracion
  usuarioActual: UsuarioActualConfiguracion
  usuariosIniciales: UsuarioEmpresa[]
  modoInicial: boolean
  usuariosActivos: number
  limiteUsuarios: number | null
  onDirtyChange: (dirty: boolean) => void
  onFeedback: (feedback: FeedbackConfiguracion | null) => void
}) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>(usuariosIniciales)
  const [draftsDirty, setDraftsDirty] = useState<Record<string, boolean>>({})
  const [mostrarInvitar, setMostrarInvitar] = useState(false)
  const [enviandoInvitacion, startInvitation] = useTransition()
  const [formInvitar, setFormInvitar] = useState({
    nombre: '',
    email: '',
    rol: 'vendedor' as Exclude<RolUsuarioEmpresa, 'admin'>,
    cargo: '',
  })

  useEffect(() => {
    setUsuarios(usuariosIniciales)
  }, [usuariosIniciales])

  useEffect(() => {
    onDirtyChange(Object.values(draftsDirty).some(Boolean))
  }, [draftsDirty, onDirtyChange])

  if (modoInicial) {
    return (
      <BloqueoConfiguracionInicial descripcion="Cuando la empresa ya exista podras invitar vendedores y tecnicos, y administrar roles." />
    )
  }

  const activosLocales = usuarios.filter((usuario) => usuario.activo).length
  const planActual = empresa.plan_actual as PlanSuscripcionEmpresa
  const limiteReal =
    limiteUsuarios ?? LIMITE_USUARIOS[planActual] ?? LIMITE_USUARIOS.pro
  const puedeInvitar = !Number.isFinite(limiteReal) || activosLocales < limiteReal

  function marcarDirty(id: string, dirty: boolean) {
    setDraftsDirty((prev) => {
      if (prev[id] === dirty) return prev
      return { ...prev, [id]: dirty }
    })
  }

  function handleUsuarioGuardado(usuarioActualizado: UsuarioEmpresa) {
    setUsuarios((prev) =>
      prev.map((item) => (item.id === usuarioActualizado.id ? usuarioActualizado : item))
    )
  }

  function handleInvitar() {
    startInvitation(async () => {
      const resultado = await invitarUsuarioEmpresa(formInvitar)

      if (resultado.error) {
        onFeedback({ type: 'error', message: resultado.error })
        return
      }

      setFormInvitar({
        nombre: '',
        email: '',
        rol: 'vendedor',
        cargo: '',
      })
      setMostrarInvitar(false)
      onFeedback({
        type: 'success',
        message: resultado.message ?? 'Invitacion enviada correctamente.',
      })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] font-[family-name:var(--font-mono)]">
              Equipo
            </p>
            <p className="text-[13px] text-[var(--text-2)]">
              {activosLocales} usuarios activos
              {Number.isFinite(limiteReal) ? ` de ${limiteReal}` : ' - plan sin limite'}.
            </p>
            {!puedeInvitar ? (
              <p className="text-[12px] text-[var(--accent)]">
                Has alcanzado el limite del plan actual.
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="accent"
            onClick={() => setMostrarInvitar(true)}
            disabled={!puedeInvitar}
          >
            Invitar usuario
          </Button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.4fr_1.4fr_120px_1fr_90px_110px] gap-3 px-3 py-2 border-b border-[var(--border)] text-[11px] text-[var(--text-3)] uppercase tracking-[0.06em] font-[family-name:var(--font-mono)]">
              <span>Nombre</span>
              <span>Email</span>
              <span>Rol</span>
              <span>Cargo</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {usuarios.map((usuario) => (
                <FilaUsuarioEditable
                  key={usuario.id}
                  usuario={usuario}
                  esUsuarioActual={usuario.id === usuarioActual.id}
                  onFeedback={onFeedback}
                  onSaved={handleUsuarioGuardado}
                  onDraftChange={marcarDirty}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {mostrarInvitar ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMostrarInvitar(false)}
          />
          <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:right-6 sm:top-20 sm:w-[420px] bg-[var(--surface)] border border-[var(--border)] rounded-t-[var(--radius)] sm:rounded-[var(--radius)] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-medium text-[var(--text)]">Invitar usuario</h2>
                  <p className="text-[13px] text-[var(--text-3)] mt-1">
                    Los usuarios invitados entran con rol vendedor o tecnico.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarInvitar(false)}
                  className="text-[var(--text-3)] text-[13px]"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nombre completo"
                  value={formInvitar.nombre}
                  onChange={(event) =>
                    setFormInvitar((prev) => ({ ...prev, nombre: event.target.value }))
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  value={formInvitar.email}
                  onChange={(event) =>
                    setFormInvitar((prev) => ({ ...prev, email: event.target.value }))
                  }
                />

                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[var(--text-2)]">Rol</label>
                  <Select
                    value={formInvitar.rol}
                    onValueChange={(valor) =>
                      setFormInvitar((prev) => ({
                        ...prev,
                        rol: valor as Exclude<RolUsuarioEmpresa, 'admin'>,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="tecnico">Tecnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  label="Cargo"
                  value={formInvitar.cargo}
                  onChange={(event) =>
                    setFormInvitar((prev) => ({ ...prev, cargo: event.target.value }))
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setMostrarInvitar(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleInvitar}
                  loading={enviandoInvitacion}
                  disabled={enviandoInvitacion}
                >
                  Enviar invitacion
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FilaUsuarioEditable({
  usuario,
  esUsuarioActual,
  onFeedback,
  onSaved,
  onDraftChange,
}: {
  usuario: UsuarioEmpresa
  esUsuarioActual: boolean
  onFeedback: (feedback: FeedbackConfiguracion | null) => void
  onSaved: (usuario: UsuarioEmpresa) => void
  onDraftChange: (id: string, dirty: boolean) => void
}) {
  const [guardando, startTransition] = useTransition()
  const [baseState, setBaseState] = useState({
    rol: usuario.rol,
    cargo: usuario.cargo ?? '',
    activo: usuario.activo,
  })
  const [draftState, setDraftState] = useState({
    rol: usuario.rol,
    cargo: usuario.cargo ?? '',
    activo: usuario.activo,
  })

  useEffect(() => {
    const siguienteBase = {
      rol: usuario.rol,
      cargo: usuario.cargo ?? '',
      activo: usuario.activo,
    }

    setBaseState(siguienteBase)
    setDraftState(siguienteBase)
  }, [usuario])

  const dirty =
    baseState.rol !== draftState.rol ||
    baseState.cargo !== draftState.cargo ||
    baseState.activo !== draftState.activo

  useEffect(() => {
    onDraftChange(usuario.id, dirty)
  }, [dirty, onDraftChange, usuario.id])

  function handleGuardar() {
    startTransition(async () => {
      const resultado = await actualizarUsuarioEmpresa({
        usuarioId: usuario.id,
        rol: draftState.rol,
        cargo: draftState.cargo,
        activo: draftState.activo,
      })

      if (resultado.error) {
        onFeedback({ type: 'error', message: resultado.error })
        return
      }

      const actualizado: UsuarioEmpresa = {
        ...usuario,
        rol: draftState.rol,
        cargo: draftState.cargo || null,
        activo: draftState.activo,
      }

      setBaseState(draftState)
      onSaved(actualizado)
      onFeedback({
        type: 'success',
        message: resultado.message ?? 'Usuario actualizado.',
      })
    })
  }

  return (
    <div className="grid grid-cols-[1.4fr_1.4fr_120px_1fr_90px_110px] gap-3 px-3 py-3 items-center">
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-[var(--text)]">{usuario.nombre}</p>
        {esUsuarioActual ? (
          <Badge variant="warning" className="w-fit">
            Tu usuario
          </Badge>
        ) : null}
      </div>

      <p className="text-[13px] text-[var(--text-2)] break-all">{usuario.email}</p>

      <div className="space-y-2">
        <Badge variant={VARIANTES_ROL_USUARIO[draftState.rol]} className="w-fit">
          {ETIQUETAS_ROL_USUARIO[draftState.rol]}
        </Badge>
        <Select
          value={draftState.rol}
          onValueChange={(valor) =>
            setDraftState((prev) => ({ ...prev, rol: valor as RolUsuarioEmpresa }))
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="tecnico">Tecnico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input
        value={draftState.cargo}
        onChange={(event) =>
          setDraftState((prev) => ({ ...prev, cargo: event.target.value }))
        }
        placeholder="Cargo"
        className="h-8"
      />

      <div className="flex items-center gap-2">
        <Switch
          checked={draftState.activo}
          onCheckedChange={(activo) =>
            setDraftState((prev) => ({ ...prev, activo }))
          }
          disabled={esUsuarioActual}
        />
        <span
          className={cn(
            'text-[12px] font-medium',
            draftState.activo ? 'text-[var(--green)]' : 'text-[var(--text-3)]'
          )}
        >
          {draftState.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleGuardar}
        disabled={!dirty || guardando}
        loading={guardando}
      >
        Guardar
      </Button>
    </div>
  )
}
