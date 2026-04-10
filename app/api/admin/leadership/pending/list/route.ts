import { NextResponse } from "next/server"
import { getAdminSupabase, adminAuth } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  const auth = await adminAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase.storage.from("leadership").list("pending", { limit: 1000 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const items: any[] = []
    for (const entry of data || []) {
      if (!entry.name || entry.name.includes(".")) continue
      const folder = `pending/${entry.name}`
      const sub = await supabase.storage.from("leadership").list(folder, { limit: 100 })
      for (const f of sub.data || []) {
        if (/\.(png|jpg|jpeg|webp)$/i.test(f.name)) {
          const path = `${folder}/${f.name}`
          const url = supabase.storage.from("leadership").getPublicUrl(path).data.publicUrl
          items.push({ leaderId: entry.name, name: f.name, path, url, created_at: f.created_at })
        }
      }
    }
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: "Failed to list pending images" }, { status: 500 })
  }
}

