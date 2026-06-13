import { NextResponse } from "next/server"

import { runCronJob } from "@/lib/backend"

export function POST(_request: Request, { params }: { params: { job: string } }) {
  const result = runCronJob(params.job)
  const status = "error" in result ? 400 : 200

  return NextResponse.json(result, { status })
}

export function GET(_request: Request, { params }: { params: { job: string } }) {
  const result = runCronJob(params.job)
  const status = "error" in result ? 400 : 200

  return NextResponse.json(result, { status })
}
