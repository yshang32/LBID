import type { Metadata } from "next"

import { PromoPage } from "@/components/promo/promo-page"

export const metadata: Metadata = {
  title: "LBID — Move cargo through capability, not connections",
  description:
    "Sealed bidding for fair logistics partnerships. LBID connects overseas cargo demand with qualified freight forwarders across air, ocean and road.",
}

export default function RootPage() {
  return <PromoPage />
}
