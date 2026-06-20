import Link from "next/link"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"

export default function LanguageSelectPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center px-4 py-12 text-center sm:px-6">
      <section className="w-full">
        <div className="mx-auto flex h-28 w-56 items-center justify-center rounded-xl border border-lblue/10 bg-white/88 p-4 shadow-[0_24px_70px_rgba(27,43,94,0.10)] backdrop-blur-xl">
          <BrandMark markClassName="h-16 w-44" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">選擇系統語言 / Choose system language</p>
        <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
          <Button asChild variant="gold" size="lg">
            <Link href="/zh">繁體中文</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/en">English system</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
