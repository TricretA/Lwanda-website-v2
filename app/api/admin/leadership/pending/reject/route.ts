import { NextResponse } from "next/server"
import { getAdminSupabase, adminAuth } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const auth = await adminAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  try {
    const body = await req.json()
    const leaderId = String(body.leaderId || "").trim()
    const path = String(body.path || "").trim()
    const comment = String(body.comment || "")
    if (!leaderId || !path.startsWith("pending/")) {
      return NextResponse.json({ error: "Invalid leaderId or path" }, { status: 400 })
    }
    const supabase = getAdminSupabase()
    const { error } = await supabase.storage.from("leadership").remove([path])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    try {
      await supabase.from("admin_logs").insert({
        action: "leader_image_rejected",
        entity_type: "leadership",
        metadata: { leaderId, path, comment },
      })
    } catch {}
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Rejection failed" }, { status: 500 })
  }
}

