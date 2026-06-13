import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    ok: true,
    onboardingDraft: {
      step: body.step ?? 0,
      savedAt: new Date().toISOString(),
      payload: body.payload ?? body,
    },
  })
}
