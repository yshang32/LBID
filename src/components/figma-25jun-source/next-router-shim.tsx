"use client"

import Link from "next/link"
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation"
import type { AnchorHTMLAttributes, ReactNode } from "react"

const locales = new Set(["zh", "en"])

function currentLocale(pathname: string | null) {
  const first = (pathname ?? "").split("/").filter(Boolean)[0]
  return locales.has(first) ? first : "zh"
}

function toNextPath(to: string, locale: string) {
  if (/^(https?:|mailto:|tel:|#)/.test(to)) return to
  const map: Record<string, string> = {
    "/": `/${locale}/dashboard`,
    "/opportunities": `/${locale}/marketplace`,
    "/active-bids": `/${locale}/active-bids`,
    "/my-routes": `/${locale}/my-routes`,
    "/analytics": `/${locale}/analytics`,
    "/requests": `/${locale}/requests`,
    "/requests/new": `/${locale}/inquiries/new`,
    "/quotations/compare": `/${locale}/quotations/compare`,
    "/orders": `/${locale}/orders`,
    "/notifications": `/${locale}/notifications`,
    "/community": `/${locale}/community`,
    "/forwarders": `/${locale}/forwarders`,
    "/profile": `/${locale}/profile`,
    "/subscription": `/${locale}/subscription`,
    "/tokens": `/${locale}/tokens`,
    "/admin": `/${locale}/admin`,
    "/admin/requests": `/${locale}/admin/shipment-requests`,
    "/admin/accounts": `/${locale}/admin/accounts`,
    "/admin/payments": `/${locale}/admin/pending-payments`,
    "/admin/audit": `/${locale}/admin/audit`,
    "/auth": `/${locale}/auth`,
    "/onboarding": `/${locale}/onboarding`,
  }
  if (map[to]) return map[to]
  if (to.startsWith("/opportunities/")) return `/${locale}/marketplace/${to.split("/").pop()}`
  if (to.startsWith("/requests/")) return `/${locale}/requests/${to.split("/").pop()}`
  if (to.startsWith("/orders/")) return `/${locale}/orders/${to.split("/").pop()}`
  if (to.startsWith("/forwarders/")) return `/${locale}/forwarders/${to.split("/").pop()}`
  return to.startsWith("/") ? `/${locale}${to}` : to
}

function fromNextPath(pathname: string | null) {
  const parts = (pathname ?? "/").split("/").filter(Boolean)
  if (locales.has(parts[0])) parts.shift()
  const normalized = `/${parts.join("/")}`
  if (normalized === "/dashboard") return "/"
  if (normalized.startsWith("/marketplace/")) return `/opportunities/${normalized.split("/").pop()}`
  if (normalized === "/marketplace") return "/opportunities"
  if (normalized === "/inquiries/new") return "/requests/new"
  if (normalized === "/admin/shipment-requests") return "/admin/requests"
  if (normalized === "/admin/pending-payments") return "/admin/payments"
  return normalized === "/" ? "/" : normalized
}

export function useNavigate() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = currentLocale(pathname)

  return (to: string | number) => {
    if (typeof to === "number") {
      router.back()
      return
    }
    router.push(toNextPath(to, locale))
  }
}

export function useParams() {
  return useNextParams()
}

export function useLocation() {
  const pathname = usePathname()
  return { pathname: fromNextPath(pathname) }
}

export function NavLink({
  to,
  className,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
  to: string
  className?: string | ((state: { isActive: boolean }) => string)
  children: ReactNode
}) {
  const pathname = usePathname()
  const locale = currentLocale(pathname)
  const nextPath = toNextPath(to, locale)
  const activePath = fromNextPath(pathname)
  const isActive = activePath === to || (to !== "/" && activePath.startsWith(`${to}/`))
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className

  return (
    <Link href={nextPath} className={resolvedClassName} {...props}>
      {children}
    </Link>
  )
}

export function Outlet() {
  return null
}

export function createBrowserRouter() {
  return {}
}

export function RouterProvider() {
  return null
}
