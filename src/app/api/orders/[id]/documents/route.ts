import { NextResponse } from "next/server"

import { DOCUMENTS_BUCKET, documentStorageReference, resolveDocumentUrl } from "@/lib/document-storage"
import { canAccessOrder } from "@/lib/order-parties"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) {
    return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })
  }

  const { data, error } = await service
    .from("documents")
    .select("id, order_id, type, file_url, uploaded_by, created_at")
    .eq("order_id", params.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const documents = await Promise.all((data || []).map(async (document) => ({
    ...document,
    file_url: await resolveDocumentUrl(service, document.file_url),
  })))
  return NextResponse.json({ documents })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) {
    return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })
  }

  const contentType = request.headers.get("content-type") || ""
  let body: Record<string, any> = {}

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const type = String(formData.get("type") || "")
    const file = formData.get("file")
    if (!type || !(file instanceof File)) {
      return NextResponse.json({ error: "DOCUMENT_TYPE_AND_FILE_REQUIRED" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "DOCUMENT_FILE_TOO_LARGE" }, { status: 400 })
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin"
    const safeType = type.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    const path = `${params.id}/${safeType}-${crypto.randomUUID()}.${extension}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await service.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

    if (uploadError) return NextResponse.json({ error: uploadError.message, bucket: DOCUMENTS_BUCKET }, { status: 500 })

    body = { type, fileUrl: documentStorageReference(path) }
  } else {
    body = await request.json().catch(() => ({}))
  }

  if (!body.type || !body.fileUrl) {
    return NextResponse.json({ error: "DOCUMENT_TYPE_AND_FILE_URL_REQUIRED" }, { status: 400 })
  }

  const { data, error } = await service
    .from("documents")
    .insert({
      order_id: params.id,
      type: body.type,
      file_url: body.fileUrl,
      uploaded_by: session.user.id,
    })
    .select("id, order_id, type, file_url, uploaded_by, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    ok: true,
    document: { ...data, file_url: await resolveDocumentUrl(service, data.file_url) },
  }, { status: 201 })
}
