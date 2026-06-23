"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Locale } from "@/lib/i18n"

export function SessionGate({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const authPath = `/${locale}/auth`
  const isPublicPreview = pathname === `/${locale}/bid-demo` || pathname === `/${locale}/product-preview`
  const isAuthPage = pathname === authPath || isPublicPreview
  const [ready, setReady] = useState(isAuthPage)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    if (isAuthPage) {
      setReady(true)
      return
    }

    const client = getSupabaseBrowserClient()
    if (!client) {
      router.replace(authPath)
      setReady(true)
      return
    }

    let active = true
    client.auth.getSession().then(({ data }) => {
      if (!active) return
      const signedIn = Boolean(data.session)
      setAuthenticated(signedIn)
      setReady(true)
      if (!signedIn) router.replace(authPath)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const signedIn = Boolean(session)
      setAuthenticated(signedIn)
      if (!signedIn) router.replace(authPath)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [authPath, isAuthPage, router])

  if (isAuthPage || (ready && authenticated)) return <>{children}</>

  return <main className="grid min-h-screen place-items-center bg-white"><div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Checking your secure session</div></main>
}
