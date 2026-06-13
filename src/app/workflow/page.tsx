"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  MessageSquare,
  PackageCheck,
  Send,
  Star,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { documentChecklist, orderPipeline, quotation } from "@/lib/data"

export default function WorkflowPage() {
  const [accepted, setAccepted] = useState(false)
  const [activeStatus, setActiveStatus] = useState(0)
  const [message, setMessage] = useState("Please confirm AWB draft and cold-chain handling window.")
  const total = useMemo(() => quotation.lineItems.reduce((sum, item) => sum + item.amount, 0), [])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">Inquiry → quotation → order</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Run the core LBID transaction flow.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            A structured agency inquiry triggers matched forwarder quotations, a PDF quote pack, order tracking, messaging, documents and review.
          </p>
        </div>
        <Button variant="gold">
          <Send className="h-4 w-4" />
          Notify matched forwarders
        </Button>
      </div>
      <section className="mt-8 grid gap-5 lg:grid-cols-[420px_1fr]">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <ClipboardList className="h-5 w-5 text-lgold" />
            <CardTitle>Agency inquiry</CardTitle>
            <CardDescription>Required cargo, route, service and deadline fields.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                Origin
                <Input defaultValue="Ho Chi Minh City" />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Destination
                <Input defaultValue="Hong Kong" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                Cargo type
                <Select defaultValue="cold">
                  <option value="general">General cargo</option>
                  <option value="dg">Dangerous goods</option>
                  <option value="cold">Cold chain</option>
                </Select>
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Mode
                <Select defaultValue="air">
                  <option value="air">Air</option>
                  <option value="sea">Sea</option>
                </Select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                Weight
                <Input defaultValue="420 kg" />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Deadline
                <Select defaultValue="48">
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                </Select>
              </label>
            </div>
            <label className="space-y-2 text-sm font-semibold">
              Services needed
              <Textarea defaultValue="Cold storage, customs clearance, local delivery, POD upload" />
            </label>
            <Button variant="gold">Submit inquiry</Button>
          </CardContent>
        </Card>
        <div className="grid gap-5">
          <Card className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <FileText className="h-5 w-5 text-lgold" />
              <CardTitle>Professional quotation</CardTitle>
              <CardDescription>Line-item pricing becomes a PDF quotation for agency review.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-white/10">
                {quotation.lineItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-mono font-bold">HKD {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total quotation</div>
                  <div className="text-3xl font-black text-lgold">HKD {total.toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="h-4 w-4" />
                    Generate PDF
                  </Button>
                  <Button variant={accepted ? "secondary" : "gold"} onClick={() => setAccepted(true)}>
                    {accepted ? "Accepted" : "Accept quotation"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.045]">
            <CardHeader>
              <PackageCheck className="h-5 w-5 text-lgold" />
              <CardTitle>Order pipeline</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-7">
              {orderPipeline.map((status, index) => (
                <button
                  key={status}
                  className={`rounded-lg border p-3 text-left text-xs font-semibold transition ${
                    index <= activeStatus ? "border-lgold/50 bg-lgold/15 text-lgold" : "border-white/10 bg-white/[0.035] text-muted-foreground"
                  }`}
                  onClick={() => setActiveStatus(index)}
                >
                  <CheckCircle2 className="mb-2 h-4 w-4" />
                  {status}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <FileCheck2 className="h-5 w-5 text-lgold" />
            <CardTitle>Documents</CardTitle>
            <CardDescription>Auto-reminder 24h before ship date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documentChecklist.map((doc, index) => (
              <div key={doc} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <span>{doc}</span>
                <Badge variant={index < 2 ? "teal" : "gold"}>{index < 2 ? "Uploaded" : "Pending"}</Badge>
              </div>
            ))}
            <Button className="w-full" variant="outline">
              Upload document
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <MessageSquare className="h-5 w-5 text-lgold" />
            <CardTitle>Order messages</CardTitle>
            <CardDescription>No external email needed for order discussion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">
              Forwarder: AWB draft is ready. Please confirm shipper details.
            </div>
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
            <Button className="w-full" variant="gold">Send message</Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <Bell className="h-5 w-5 text-lgold" />
            <CardTitle>Notifications and review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm">
              Email via Resend + in-app notification centre will fire on quotation, acceptance, status update and missing document reminder.
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completion review</span>
              <div className="flex gap-1 text-lgold">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
