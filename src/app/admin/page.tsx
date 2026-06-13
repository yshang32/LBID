import { BarChart3, BadgeCheck, Crown, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { forwarders, membershipTiers } from "@/lib/data"

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <Badge variant="gold">Admin panel</Badge>
      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Verify forwarders and monitor marketplace quality.</h1>
      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric icon={Users} label="Forwarders" value={String(forwarders.length)} />
        <Metric icon={BadgeCheck} label="Verified" value="3" />
        <Metric icon={Crown} label="Paid tiers" value="2" />
        <Metric icon={BarChart3} label="Quote win rate" value="38%" />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <CardTitle>Forwarder verification queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {forwarders.map((forwarder) => (
              <div key={forwarder.slug} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{forwarder.name}</div>
                  <div className="text-sm text-muted-foreground">{forwarder.coverage.join(", ")}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="teal">{forwarder.tier}</Badge>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <CardTitle>Tier controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {membershipTiers.map((tier) => (
              <div key={tier.name} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{tier.name}</span>
                  <Badge variant="gold">{tier.price}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-lgold" />
        <div className="mt-3 text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-black">{value}</div>
      </CardContent>
    </Card>
  )
}
