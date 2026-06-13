import { NextResponse } from "next/server"

import { getBackendSnapshot } from "@/lib/backend"

export function GET() {
  return NextResponse.json({ subscription: getBackendSnapshot().subscription })
}
