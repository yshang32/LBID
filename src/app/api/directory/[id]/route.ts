import { NextResponse } from "next/server"

import { getDirectory } from "@/lib/backend"

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = getDirectory().find((item) => item.slug === params.id)
  if (!profile) return NextResponse.json({ error: "DIRECTORY_PROFILE_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ profile })
}
