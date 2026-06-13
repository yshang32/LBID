import { Building2, CheckCircle2, KeyRound, Shield, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const roles = [
  { value: "agency", label: "Agency", description: "Submit inquiries, review quotations, accept orders." },
  { value: "forwarder", label: "Forwarder", description: "Receive matching inquiries, quote, manage shipments." },
  { value: "admin", label: "Admin", description: "Verify forwarders, manage tiers, monitor analytics." },
]

export default function AuthPage() {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[.85fr_1.15fr]">
      <section className="space-y-5">
        <Badge variant="gold">Authentication first</Badge>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Role-based onboarding for LBID.</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Supabase Auth will own user identity, while LBID stores role, company, referral code, points and forwarder profile metadata in PostgreSQL.
        </p>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <CardTitle>Supabase status</CardTitle>
            <CardDescription>Build-safe client initialization is already wired.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Badge variant={hasSupabase ? "teal" : "gold"}>{hasSupabase ? "Configured" : "Demo mode"}</Badge>
            <span className="text-sm text-muted-foreground">
              {hasSupabase ? "Env vars found. Forms can be connected to Supabase actions." : "Add .env.local values from .env.example to enable live auth."}
            </span>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <UserPlus className="h-5 w-5 text-lgold" />
            <CardTitle>Register company</CardTitle>
            <CardDescription>Agency, forwarder and admin accounts share one Supabase Auth base.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="space-y-2 text-sm font-semibold">
              Role
              <Select defaultValue="agency">
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Company name
              <Input placeholder="Saigon Freight Agency" />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Country
              <Input placeholder="Vietnam" />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Email
              <Input type="email" placeholder="ops@agency.vn" />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Password
              <Input type="password" placeholder="Minimum 8 characters" />
            </label>
            <Button className="w-full" variant="gold">
              Create account
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <KeyRound className="h-5 w-5 text-lgold" />
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Route users into their role-based dashboard after auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="space-y-2 text-sm font-semibold">
              Email
              <Input type="email" placeholder="you@company.com" />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Password
              <Input type="password" placeholder="Password" />
            </label>
            <Button className="w-full">Sign in</Button>
            <Separator />
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.value} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-2 font-semibold">
                    {role.value === "admin" ? <Shield className="h-4 w-4 text-lgold" /> : <Building2 className="h-4 w-4 text-lgold" />}
                    {role.label}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045] lg:col-span-2">
          <CardHeader>
            <CardTitle>Next implementation hook</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            {["Supabase signUp with role metadata", "Create public.users row", "Redirect by role dashboard"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-lgold" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
