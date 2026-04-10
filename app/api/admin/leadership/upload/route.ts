import { NextResponse } from "next/server"
import { getAdminSupabase, adminAuth } from "@/lib/supabase/admin"

function inferExt(type?: string, fallback?: string) {
  if (!type) return fallback || ".webp"
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg"
  if (type.includes("png")) return ".png"
  if (type.includes("webp")) return ".webp"
  return fallback || ".webp"
}

export async function POST(req: Request) {
  const auth = await adminAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const leaderId = String(body.leaderId || "").trim()
    const filename = String(body.filename || "").trim()
    const type = String(body.type || "")
    const pending = !!body.pending
    if (!leaderId) return NextResponse.json({ error: "leaderId required" }, { status: 400 })

    const now = Date.now()
    const base = filename ? filename.replace(/[^a-zA-Z0-9_\-.]/g, "") : ""
    const ext = inferExt(type, base.includes(".") ? base.slice(base.lastIndexOf(".")) : undefined)
    const safeName = `profile-${now}${ext}`
    const path = pending ? `pending/${leaderId}/${safeName}` : `${leaderId}/${safeName}`

    const supabase = getAdminSupabase()
    const { data, error } = await supabase.storage.from("leadership").createSignedUploadUrl(path)
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || "Failed to create signed upload URL" }, { status: 500 })
    }
    const publicUrl = supabase.storage.from("leadership").getPublicUrl(path).data.publicUrl
    return NextResponse.json({ signedUrl: data.signedUrl, publicUrl, path })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload init failed" }, { status: 500 })
  }
}
