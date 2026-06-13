import { NextResponse } from "next/server"

import { getDirectory } from "@/lib/backend"

export function GET() {
  return NextResponse.json({ directory: getDirectory() })
}
