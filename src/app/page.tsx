import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function LanguageSelectPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center px-4 py-12 text-center sm:px-6">
      <section>
        <div className="mx-auto flex h-28 w-80 items-center justify-center rounded-xl border border-white/10 bg-[#0d1116] px-5 shadow-[0_18px_45px_rgba(13,17,22,0.22)]">
          <Image
            src="/assets/lbid-logo-site-lockup.png"
            alt="LBID"
            width={336}
            height={100}
            className="h-20 w-auto object-contain"
            priority
          />
        </div>
        <p className="mt-6 text-lg text-muted-foreground">選擇系統語言 / Choose system language</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
