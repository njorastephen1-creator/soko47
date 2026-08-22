import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Lock, MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [fullPhoto, setFullPhoto] = useState<string | null>(null);
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
      const { data } = await supabase.from("vendors").select("shop_name, user_id, profile_image_url, slug, market_name, county_slug, rating_sum, rating_count, display_name").eq("id", vendorId).maybeSingle();
      return data;
    },
  });
  const { data: buyerProf } = useQuery({
    queryKey: ["buyer-prof", buyerId],
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("display_name, photo_url").eq("user_id", buyerId).maybeSingle();
      return data || null;
    },
  });
  const { data: myProf } = useQuery({
    queryKey: ["my-prof", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("display_name").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => {
    if (!msgs || !session) return;
    const myId = vendor ? vendor.user_id : session.user.id;
    const unread = msgs.filter((m: any) => m.sender_id !== myId && !m.read_at).map((m: any) => m.id);
    if (unread.length === 0) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => qc.invalidateQueries());
  }, [msgs, session, vendor]);
  if (!session) return null;
  const myId = vendor ? vendor.user_id : session.user.id;
  const iAmVendor = vendor && vendor.user_id === session.user.id;
  const otherName = iAmVendor ? (buyerProf && buyerProf.display_name ? buyerProf.display_name : (((msgs || []).find((m: any) => m.sender_id !== myId) || {}).sender_name || "Customer")) : (vendor ? (vendor.display_name || vendor.shop_name) : "Chat");
  const otherPhoto = iAmVendor ? (buyerProf ? buyerProf.photo_url : null) : (vendor ? vendor.profile_image_url : null);
  const otherInitial = otherName.slice(0, 1).toUpperCase();
  const onFile = async (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    const path = "chat/" + Date.now() + "_" + f.name.replace(/[^a-zA-Z0-9.]+/g, "_");
    const { error } = await supabase.storage.from("product-images").upload(path, f);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setAttach({ url: data.publicUrl, type: f.type.startsWith("video") ? "video" : "image" });
  };
  const send = async () => {
    if (editingId) {
      if (!body.trim()) return;
      await supabase.from("messages").update({ body: body.trim(), edited_at: new Date().toISOString() }).eq("id", editingId);
      setBody(""); setEditingId(null); setSelectedId(null);
      qc.invalidateQueries();
      return;
    }
    if (!body.trim() && !attach) return;
    await supabase.from("messages").insert({ vendor_id: vendorId, buyer_id: buyerId, sender_id: session.user.id, sender_name: iAmVendor ? (vendor.display_name || vendor.shop_name) : (myProf && myProf.display_name ? myProf.display_name : (session.user.email || "Buyer")), body: body.trim() || (attach ? (attach.type === "video" ? "Video" : "Photo") : ""), attachment_url: attach ? attach.url : null, attachment_type: attach ? attach.type : null });
    setBody(""); setAttach(null);
    qc.invalidateQueries();
  };
  const selectedMsg = (msgs || []).find((m: any) => m.id === selectedId);
  const isMine = selectedMsg && selectedMsg.sender_id === myId;
  const doDelete = async () => {
    if (!selectedMsg || !window.confirm("Delete this message?")) return;
    await supabase.from("messages").delete().eq("id", selectedMsg.id);
    setSelectedId(null);
    qc.invalidateQueries();
  };
  const doEdit = () => {
    if (!selectedMsg) return;
    setEditingId(selectedMsg.id);
    setBody(selectedMsg.body);
    setSelectedId(null);
  };
  const doDownload = () => {
    if (!selectedMsg || !selectedMsg.attachment_url) return;
    const a = document.createElement("a");
    a.href = selectedMsg.attachment_url;
    a.download = "soko47-" + selectedMsg.id;
    a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
    setSelectedId(null);
  };
  const doCopy = () => {
    if (!selectedMsg) return;
    navigator.clipboard.writeText(selectedMsg.body);
    toast.success("Message copied");
    setSelectedId(null);
  };
  const clearChat = async () => {
    if (!window.confirm("Clear ALL messages in this chat for both sides?")) return;
    await supabase.from("messages").delete().eq("vendor_id", vendorId).eq("buyer_id", buyerId);
    setShowProfile(false);
    qc.invalidateQueries();
    toast.success("Chat cleared");
  };
  return (
    <div className="mx-auto flex max-w-2xl flex-col md:px-4 md:pt-6" style={{ height: "94vh" }} onClick={() => setSelectedId(null)}>
      {fullPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setFullPhoto(null)}>
          <img src={fullPhoto} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"><X className="size-6" /></button>
        </div>
      ) : null}
      <div className={"flex items-center gap-3 rounded-t-2xl p-3 text-white " + (selectedMsg ? "bg-[#202c33]" : "bg-[#075E54]")}>
        {otherPhoto ? <img src={otherPhoto} alt="" onClick={(e) => { e.stopPropagation(); setFullPhoto(otherPhoto); }} className="size-10 cursor-pointer rounded-full object-cover" /> : <span onClick={() => setShowProfile(!showProfile)} className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/20 font-display font-bold">{otherInitial}</span>}
        <div className="flex-1 cursor-pointer" onClick={() => setShowProfile(!showProfile)}>
          <p className="font-semibold">{otherName}</p>
          <p className="text-[11px] opacity-80">{selectedMsg ? (isMine ? "Your message selected" : "Their message selected") : "Long-press / right-click a message"}</p>
        </div>
        {selectedMsg ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={doCopy} className="rounded-full p-2 hover:bg-white/10" title="Copy"><Copy className="size-5" /></button>
            {selectedMsg.attachment_url ? <button onClick={doDownload} className="rounded-full p-2 hover:bg-white/10" title="Download"><Download className="size-5" /></button> : null}
            {isMine ? <button onClick={doEdit} className="rounded-full p-2 hover:bg-white/10" title="Edit"><Pencil className="size-5" /></button> : null}
            {isMine ? <button onClick={doDelete} className="rounded-full p-2 hover:bg-white/10" title="Delete"><Trash2 className="size-5" /></button> : null}
            <button onClick={() => setSelectedId(null)} className="rounded-full p-2 hover:bg-white/10"><X className="size-5" /></button>
          </div>
        ) : (
          <MessageCircle className="size-4 opacity-70" />
        )}
      </div>
      {showProfile ? (
        <div className="max-h-[45vh] overflow-y-auto border-b border-border bg-card p-4">
          <div className="flex flex-col items-center text-center">
            {otherPhoto ? <img src={otherPhoto} alt="" onClick={() => setFullPhoto(otherPhoto)} className="size-24 cursor-pointer rounded-full object-cover ring-4 ring-accent/20" /> : <span className="flex size-24 items-center justify-center rounded-full bg-accent/15 font-display text-3xl font-bold text-accent-deep">{otherInitial}</span>}
            <p className="mt-2 font-display text-lg font-bold">{otherName}</p>
            {vendor && !iAmVendor ? <p className="text-xs text-muted-foreground">{vendor.market_name || "Soko47 trader"} · ⭐ {Number(vendor.rating_count) > 0 ? (Number(vendor.rating_sum) / Number(vendor.rating_count)).toFixed(1) : "New"}</p> : null}
            {vendor && iAmVendor ? <p className="text-xs text-muted-foreground">Your customer</p> : null}
            {vendor && !iAmVendor ? <a href={"/shop/" + vendor.slug} className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Visit shop</a> : null}
            <Link to="/profile" className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"><Pencil className="size-3.5" /> Edit my profile (only you can edit it)</Link>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Media in this chat</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(msgs || []).filter((m: any) => m.attachment_url).map((m: any) => (
              m.attachment_type === "video" ? <video key={m.id} src={m.attachment_url} className="aspect-square w-full rounded-lg object-cover" /> : <img key={m.id} src={m.attachment_url} alt="" onClick={(e) => { e.stopPropagation(); setFullPhoto(m.attachment_url); }} className="aspect-square w-full cursor-pointer rounded-lg object-cover" />
            ))}
            {(msgs || []).filter((m: any) => m.attachment_url).length === 0 && <p className="col-span-3 text-xs text-muted-foreground">No media shared yet.</p>}
          </div>
          <button onClick={clearChat} className="mt-4 w-full rounded-xl border border-destructive/40 py-2 text-sm font-semibold text-destructive"><Trash2 className="size-4" /> Clear chat</button>
        </div>
      ) : null}
      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ backgroundColor: "#efeae2", backgroundImage: "radial-gradient(#d8d2c6 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        {(msgs || []).map((m: any) => {
          const mine = m.sender_id === myId;
          const bubbleBg = mine ? "bg-[#d9fdd3]" : "bg-white";
          const ring = selectedId === m.id ? "ring-2 ring-[#25D366]" : "";
          const wrap = "flex " + (mine ? "justify-end" : "justify-start");
          return (
            <div key={m.id} className={wrap}>
              <div onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedId(m.id); if (navigator.vibrate) navigator.vibrate(40); }} onTouchStart={() => { (window as any).__lp = setTimeout(() => { setSelectedId(m.id); if (navigator.vibrate) navigator.vibrate(40); }, 450); }} onTouchEnd={() => clearTimeout((window as any).__lp)} onTouchMove={() => clearTimeout((window as any).__lp)} className={"select-none rounded-xl px-3 py-2 text-sm shadow-sm " + bubbleBg + " " + ring} style={{ WebkitTouchCallout: "none", userSelect: "none" } as any}>
                {m.attachment_url && m.attachment_type === "image" ? <img src={m.attachment_url} alt="" onClick={(e) => { e.stopPropagation(); setFullPhoto(m.attachment_url); }} className="mb-1 max-h-64 cursor-pointer rounded-lg" /> : null}
                {m.attachment_url && m.attachment_type === "video" ? <video src={m.attachment_url} controls className="mb-1 max-h-64 rounded-lg" /> : null}
                <p>{m.body}</p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  {m.edited_at ? <span className="text-[10px] italic text-muted-foreground">edited</span> : null}
                  <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
          );
        })}
        {(msgs || []).length === 0 && <p className="flex items-center justify-center gap-1 pt-10 text-center text-sm text-muted-foreground"><Lock className="size-3.5" /> Messages are private - say habari to start.</p>}
        <div ref={endRef} />
      </div>
      <div className="rounded-b-2xl bg-[#f0f2f5] p-2" onClick={(e) => e.stopPropagation()}>
        {attach ? <div className="mb-2 flex items-center gap-2 rounded-lg bg-white p-2 text-xs"><span className="flex-1 truncate">{attach.type === "video" ? "Video ready" : "Photo ready"}</span><button onClick={() => setAttach(null)}><X className="size-4" /></button></div> : null}
        <div className="flex items-center gap-2">
          <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white shadow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#075E54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.98 8.83l-8.58 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
          </label>
          <Input className="rounded-full bg-white" value={body} onChange={(e) => setBody(e.target.value)} placeholder={editingId ? "Editing..." : "Type a message"} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          <Button onClick={send} className="size-11 shrink-0 rounded-full bg-[#25D366] p-0 hover:bg-[#1ebe5b]"><Send className="size-5" /></Button>
        </div>
      </div>
    </div>
  );
}
