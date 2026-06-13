import { NextResponse } from "next/server"

import { matchRecords } from "@/lib/data"

export function GET() {
  return NextResponse.json({ matchRecords })
}
