'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DashboardAutoRefresh() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function refrescar() {
    startTransition(() => {
      router.refresh()
    })
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, 5 * 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [router])

  return (
    <Button variant="secondary" onClick={refrescar} loading={isPending}>
      <RefreshCw className="h-3.5 w-3.5" />
      Refrescar
    </Button>
  )
}
