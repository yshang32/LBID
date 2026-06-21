import type { SupabaseClient } from "@supabase/supabase-js"

export const DOCUMENTS_BUCKET = "documents"
const STORAGE_PREFIX = `storage://${DOCUMENTS_BUCKET}/`

export function documentStorageReference(path: string) {
  return `${STORAGE_PREFIX}${path}`
}

export function documentStoragePath(fileUrl: string | null | undefined) {
  if (!fileUrl?.startsWith(STORAGE_PREFIX)) return null
  return fileUrl.slice(STORAGE_PREFIX.length)
}

export async function resolveDocumentUrl(
  supabase: SupabaseClient,
  fileUrl: string,
  expiresIn = 900,
) {
  const path = documentStoragePath(fileUrl)
  if (!path) return fileUrl

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresIn)

  return error || !data?.signedUrl ? null : data.signedUrl
}
