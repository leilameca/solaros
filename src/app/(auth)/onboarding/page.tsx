import { redirect } from 'next/navigation'
import { createClient, obtenerConfigEmpresa, obtenerEmpresaId } from '@/lib/supabase/server'
import { FormularioOnboarding } from '@/components/auth/FormularioOnboarding'

export default async function OnboardingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const empresaId = await obtenerEmpresaId()

  if (!empresaId) {
    redirect('/configuracion')
  }

  const config = await obtenerConfigEmpresa()

  if (config?.onboarding_completado) {
    redirect('/dashboard')
  }

  return (
    <FormularioOnboarding
      empresa={{
        nombre: config?.nombre_empresa ?? 'Tu empresa',
        precio_wp: Number(config?.precio_wp ?? 0.85),
        tasa_dolar: Number(config?.tasa_dolar ?? 54),
        logo_url: config?.logo_url ?? null,
      }}
    />
  )
}
