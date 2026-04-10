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
    const fname = path.split("/").pop()!
    const approvedPath = `${leaderId}/${fname}`
    // Try move; if not supported, copy+remove
    let moveErr: any = null
    try {
      const { error } = await supabase.storage.from("leadership").move(path, approvedPath)
      moveErr = error
    } catch (e) {
      moveErr = e
    }
    if (moveErr) {
      const copy = await supabase.storage.from("leadership").copy(path, approvedPath)
      if (copy.error) return NextResponse.json({ error: copy.error.message }, { status: 500 })
      await supabase.storage.from("leadership").remove([path])
    }
    const publicUrl = supabase.storage.from("leadership").getPublicUrl(approvedPath).data.publicUrl
    const up = await supabase.from("leadership").update({ image_path: publicUrl }).eq("id", leaderId)
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 })
    try {
      await supabase.from("admin_logs").insert({
        action: "leader_image_approved",
        entity_type: "leadership",
        metadata: { leaderId, path, approvedPath, comment },
      })
    } catch {}
    return NextResponse.json({ ok: true, image_path: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Approval failed" }, { status: 500 })
  }
}

