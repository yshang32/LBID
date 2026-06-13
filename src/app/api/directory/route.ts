import { NextResponse } from "next/server"

import { getDirectory } from "@/lib/backend"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ directory: getDirectory() })
}
