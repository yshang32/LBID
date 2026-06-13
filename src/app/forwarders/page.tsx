import Link from "next/link"
import { ArrowUpRight, BadgeCheck, Filter, MapPin, Search, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { forwarders } from "@/lib/data"

export default function ForwardersPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">Public directory</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Find verified Hong Kong forwarders.</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Search by service coverage, rating, membership tier and operational badges before inviting quotations.
          </p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          Saved filters
        </Button>
      </div>
      <Card className="mt-8 border-white/10 bg-white/[0.055]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_140px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search forwarder, service, coverage..." />
          </div>
          <Select defaultValue="all">
            <option value="all">All services</option>
            <option value="air">Air freight</option>
            <option value="sea">Sea freight</option>
            <option value="cold">Cold chain</option>
          </Select>
          <Select defaultValue="all">
            <option value="all">All tiers</option>
            <option>Free</option>
            <option>Standard</option>
            <option>Premium</option>
            <option>Partner</option>
          </Select>
          <Button variant="gold">Search</Button>
        </CardContent>
      </Card>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {forwarders.map((forwarder) => (
          <Card key={forwarder.slug} className="border-white/10 bg-white/[0.045]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant={forwarder.tier === "Premium" || forwarder.tier === "Partner" ? "gold" : "secondary"}>
                    {forwarder.tier}
                  </Badge>
                  <CardTitle className="mt-3">{forwarder.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1 rounded-md bg-lgold/15 px-2 py-1 text-sm font-bold text-lgold">
                  <Star className="h-4 w-4 fill-current" />
                  {forwarder.rating}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">{forwarder.description}</p>
              <div className="flex flex-wrap gap-2">
                {forwarder.badges.map((badge) => (
                  <Badge key={badge} variant="teal">
                    <BadgeCheck className="mr-1 h-3 w-3" />
                    {badge}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-muted-foreground">Completed</div>
                  <div className="text-xl font-black">{forwarder.completedOrders}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-muted-foreground">Response</div>
                  <div className="text-xl font-black">{forwarder.responseTime}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-lgold" />
                {forwarder.coverage.join(", ")}
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/forwarders/${forwarder.slug}`}>
                  View profile <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
