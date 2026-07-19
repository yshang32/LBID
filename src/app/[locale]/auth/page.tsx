import { PromoPage } from "@/components/promo/promo-page"
import type { PromoAuthMode } from "@/components/promo/promo-auth-panel"
import { isLocale, type Locale } from "@/lib/i18n"

function resolveMode(value: string | string[] | undefined): PromoAuthMode {
  const mode = Array.isArray(value) ? value[0] : value
  return mode === "register" || mode === "reset" || mode === "update" ? mode : "login"
}

export default function AuthPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams?: { mode?: string | string[] }
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <PromoPage locale={locale} initialAuthMode={resolveMode(searchParams?.mode)} />
}
