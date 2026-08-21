import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MoreVertical, Paperclip, Pencil, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export const Route = createFileRoute("/_authenticated/chat/$vendorId/$buyerId")({ component: ChatThread });
function ChatThread() {
  const { vendorId, buyerId } = Route.useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [attach, setAttach] = useState<{ url: string; type: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const { data: msgs } = useQuery({
    queryKey: ["thread", vendorId, buyerId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("vendor_id", vendorId).eq("buyer_id", buyerId).order("created_at");
      return data || [];
    },
  });
  const { data: vendor } = useQuery({
    queryKey: ["chat-vendor", vendorId],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("shop_name, user_id").eq("id", vendorId).maybeSingle();
      return data;
    },
  });
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
  if (!session) return null;
  const iAmVendor = vendor && vendor.user_id === session.user.id;
  const onFile = async (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB - short videos & photos only");
    const path = "chat/" + Date.now() + "_" + f.name.replace(/[^a-zA-Z0-9.]+/g, "_");
    const { error } = await supabase.storage.from("product-images").upload(path, f);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setAttach({ url: data.publicUrl, type: f.type.startsWith("video") ? "video" : "image" });
    toast.success("Attached - now hit send");
  };
  const send = async () => {
    if (editingId) {
      if (!body.trim()) return;
      await supabase.from("messages").update({ body: body.trim(), edited_at: new Date().toISOString() }).eq("id", editingId);
      setBody("");
      setEditingId(null);
      qc.invalidateQueries();
      return;
    }
    if (!body.trim() && !attach) return;
    await supabase.from("messages").insert({ vendor_id: vendorId, buyer_id: buyerId, sender_id: session.user.id, sender_name: iAmVendor ? vendor.shop_name : (session.user.email || "Buyer"), body: body.trim() || (attach ? (attach.type === "video" ? "🎥 Video" : "📷 Photo") : ""), attachment_url: attach ? attach.url : null, attachment_type: attach ? attach.type : null });
    setBody("");
    setAttach(null);
    qc.invalidateQueries();
  };
  const del = async (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    await supabase.from("messages").delete().eq("id", id);
    setMenuId(null);
    qc.invalidateQueries();
    toast.success("Message deleted");
  };
  const startEdit = (m: any) => {
    setEditingId(m.id);
    setBody(m.body);
    setMenuId(null);
  };
  const download = (m: any) => {
    const a = document.createElement("a");
    a.href = m.attachment_url;
    a.download = "soko47-" + m.id;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMenuId(null);
    toast.success("Download started");
  };
  return (
    <div className="mx-auto flex max-w-2xl flex-col md:px-4 md:pt-6" style={{ height: "94vh" }}>
      <div className="flex items-center gap-3 rounded-t-2xl bg-[#075E54] p-3 text-white">
        <span className="flex size-10 items-center justify-center rounded-full bg-white/20 font-display font-bold">{(vendor ? vendor.shop_name : "C").slice(0, 1)}</span>
        <div>
          <p className="font-semibold">{iAmVendor ? "Customer" : vendor ? vendor.shop_name : "Chat"}</p>
          <p className="text-[11px] opacity-80">{editingId ? "✏️ Editing - hit send to save" : "Soko47 chat · tap ⋮ on a message for options"}</p>
        </div>
        {editingId ? <button className="ml-auto text-xs underline" onClick={() => { setEditingId(null); setBody(""); }}>cancel</button> : null}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ backgroundColor: "#efeae2", backgroundImage: "radial-gradient(#d8d2c6 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        {menuId ? <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} /> : null}
        {(msgs || []).map((m: any) => (
          <div key={m.id} className={"flex " + (m.sender_id === session.user.id ? "justify-end" : "justify-start")}>
            <div className="relative max-w-[80%]">
              <div className={"rounded-xl px-3 py-2 text-sm shadow-sm " + (m.sender_id === session.user.id ? "bg-[#d9fdd3]" : "bg-white")}>
                {m.attachment_url && m.attachment_type === "image" ? <img src={m.attachment_url} alt="" className="mb-1 max-h-64 rounded-lg" /> : null}
                {m.attachment_url && m.attachment_type === "video" ? <video src={m.attachment_url} controls className="mb-1 max-h-64 rounded-lg" /> : null}
                <p>{m.body}</p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  {m.edited_at ? <span className="text-[10px] italic text-muted-foreground">edited</span> : null}
                  <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
              <button onClick={() => setMenuId(menuId === m.id ? null : m.id)} className={"absolute -top-2 rounded-full bg-white p-1 shadow " + (m.sender_id === session.user.id ? "-left-2" : "-right-2")}>
                <MoreVertical className="size-4 text-muted-foreground" />
              </button>
              {menuId === m.id ? (
                <div className={"absolute top-4 z-20 w-40 overflow-hidden rounded-xl border border-border bg-white shadow-xl " + (m.sender_id === session.user.id ? "left-0" : "right-0")}>
                  {m.attachment_url ? <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary" onClick={() => download(m)}><Download className="size-4" /> Download</button> : null}
                  {m.sender_id === session.user.id ? <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary" onClick={() => startEdit(m)}><Pencil className="size-4" /> Edit</button> : null}
                  {m.sender_id === session.user.id ? <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-secondary" onClick={() => del(m.id)}><Trash2 className="size-4" /> Delete</button> : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {(msgs || []).length === 0 && <p className="pt-10 text-center text-sm text-muted-foreground">🔒 Messages are between you and the trader only. Say habari!</p>}
        <div ref={endRef} />
      </div>
      <div className="rounded-b-2xl bg-[#f0f2f5] p-2">
        {attach ? <div className="mb-2 flex items-center gap-2 rounded-lg bg-white p-2 text-xs"><span className="flex-1 truncate">{attach.type === "video" ? "🎥 Video ready" : "📷 Photo ready"}</span><button onClick={() => setAttach(null)}><X className="size-4 text-destructive" /></button></div> : null}
        <div className="flex items-center gap-2">
          <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white shadow">
            <Paperclip className="size-5 text-[#075E54]" />
            <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
          </label>
          <Input className="rounded-full bg-white" value={body} onChange={(e) => setBody(e.target.value)} placeholder={editingId ? "Edit your message..." : "Type a message"} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          <Button onClick={send} className="size-11 shrink-0 rounded-full bg-[#25D366] p-0 hover:bg-[#1ebe5b]"><Send className="size-5" /></Button>
        </div>
      </div>
    </div>
  );
}
