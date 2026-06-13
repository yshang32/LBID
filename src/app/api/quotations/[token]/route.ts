import { NextResponse } from "next/server"

import { quotation } from "@/lib/data"

export function GET(_request: Request, { params }: { params: { token: string } }) {
  return NextResponse.json({
    quotation: {
      ...quotation,
      publicToken: params.token,
      visibility: "public_link",
    },
  })
}
