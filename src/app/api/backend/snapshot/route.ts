import { NextResponse } from "next/server"

import { getBackendSnapshot } from "@/lib/backend"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(getBackendSnapshot())
}
