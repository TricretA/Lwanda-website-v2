\"use client\"

import { useEffect, useState } from \"react\"
import { Button } from \"@/components/ui/button\"
import { Input } from \"@/components/ui/input\"
import { Textarea } from \"@/components/ui/textarea\"
import { getSupabaseBrowser } from \"@/lib/supabase/client\"
import Image from \"next/image\"
import { toast } from \"sonner\"

type PendingItem = { leaderId: string; path: string; url: string; name: string }

export default function ReviewLeaderImagesPage() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})
  const supabase = getSupabaseBrowser()

  const load = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      const res = await fetch(\"/api/admin/leadership/pending/list\", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || \"Failed to load pending images\")
      setItems(j.items || [])
    } catch (e: any) {
      toast.error(e?.message || \"Failed to load pending images\")
    }
  }

  useEffect(() => { load() }, [])

  const act = async (kind: \"approve\" | \"reject\", it: PendingItem) => {
    setBusy(it.path)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      const res = await fetch(`/api/admin/leadership/pending/${kind}`, {
        method: \"POST\",
        headers: { \"Content-Type\": \"application/json\", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ leaderId: it.leaderId, path: it.path, comment: comments[it.path] || \"\" }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || `${kind} failed`)
      toast.success(kind === \"approve\" ? \"Image approved\" : \"Image rejected\")
      await load()
    } catch (e: any) {
      toast.error(e?.message || \"Action failed\")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className=\"container mx-auto py-10\">
      <h1 className=\"text-2xl font-bold mb-6\">Leader Image Review</h1>
      {items.length === 0 ? (
        <div className=\"text-muted-foreground\">No pending images.</div>
      ) : (
        <div className=\"grid gap-6 md:grid-cols-2 lg:grid-cols-3\">
          {items.map((it) => (
            <div key={it.path} className=\"border rounded-lg bg-card\">
              <div className=\"relative w-full h-64 rounded-t-lg overflow-hidden bg-muted\">
                {/* Using next/image for optimization; public URL for preview */}
                <Image src={it.url} alt={it.name} fill className=\"object-cover\" sizes=\"(max-width: 768px) 100vw, 33vw\" />
              </div>
              <div className=\"p-4 space-y-3\">
                <div className=\"text-sm\">
                  <div><span className=\"text-muted-foreground\">Leader:</span> <span className=\"font-mono\">{it.leaderId}</span></div>
                  <div className=\"truncate text-muted-foreground\" title={it.path}>{it.path}</div>
                </div>
                <Textarea
                  placeholder=\"Add review comment (optional)\"
                  value={comments[it.path] || \"\"}
                  onChange={(e) => setComments((m) => ({ ...m, [it.path]: e.target.value }))}
                />
                <div className=\"flex gap-2 justify-end\">
                  <Button variant=\"outline\" disabled={busy === it.path} onClick={() => act(\"reject\", it)}>Reject</Button>
                  <Button disabled={busy === it.path} onClick={() => act(\"approve\", it)}>{busy === it.path ? \"Working...\" : \"Approve\"}</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

