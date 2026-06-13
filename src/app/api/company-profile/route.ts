import { NextResponse } from "next/server"

import { companyProfile } from "@/lib/data"

export function GET() {
  return NextResponse.json({ companyProfile })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    ok: true,
    companyProfile: {
      ...companyProfile,
      ...body,
      updatedAt: new Date().toISOString(),
    },
  })
}
