import fs from 'fs';

let iu = fs.readFileSync('src/components/image-upload.tsx', 'utf8');
let bucket = 'product-images';
const bm = iu.match(/storage\.from\(["']([^"']+)["']\)/);
if (bm) bucket = bm[1];

fs.writeFileSync('src/routes/_authenticated/chats.tsx', `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export const Route = createFileRoute("/_authenticated/chats")({ component: ChatsInbox });
function ChatsInbox() {
  const { session } = useSession();
  const { data: vendor } = useQuery({
    queryKey: ["inbox-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, shop_name, profile_image_url, user_id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: allMsgs } = useQuery({
    queryKey: ["inbox-msgs", vendor ? vendor.id : session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      if (vendor) {
        const { data } = await supabase.from("messages").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false });
        return data || [];
      }
      const { data } = await supabase.from("messages").select("*, vendors(shop_name, profile_image_url)").eq("buyer_id", session!.user.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  const threads: any = {};
  (allMsgs || []).forEach((m: any) => {
    const otherId = vendor ? m.sender_id : m.vendor_id;
    if (!threads[otherId]) {
      threads[otherId] = {
        otherId,
        vendorId: m.vendor_id,
        buyerId: vendor ? m.buyer_id : session!.user.id,
        name: vendor ? (m.sender_name || "Customer") : (m.vendors ? m.vendors.shop_name : "Trader"),
        photo: vendor ? null : (m.vendors ? m.vendors.profile_image_url : null),
        last: m.body,
        lastAt: m.created_at,
        unread: 0,
      };
    }
    const myId = vendor ? vendor.user_id : session!.user.id;
    if (m.sender_id !== myId && !m.read_at) threads[otherId].unread += 1;
  });
  const list = Object.values(threads).sort((a: any, b: any) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MessageCircle className="size-7 text-accent" /> Chats</h1>
      <div className="mt-6 space-y-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
        {list.map((t: any) => {
          const initial = (t.name || "?").slice(0, 1).toUpperCase();
          return (
            <Link key={t.otherId} to={"/chat/" + t.vendorId + "/" + t.buyerId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary">
              {t.photo ? <img src={t.photo} alt="" className="size-12 rounded-full object-cover" /> : <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-deep">{initial}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{t.name}</p>
                  <p className="shrink-0 text-[11px] text-muted-foreground">{new Date(t.lastAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">{t.last}</p>
                  {t.unread > 0 ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-white">{t.unread}</span> : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
`);
console.log('Inbox rebuilt');

fs.writeFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export const Route = createFileRoute("/_authenticated/chat/\$vendorId/\$buyerId")({ component: ChatThread });
function ChatThread() {
  const { vendorId, buyerId } = Route.useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [attach, setAttach] = useState<{ url: string; type: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      const { data } = await supabase.from("vendors").select("shop_name, user_id, profile_image_url").eq("id", vendorId).maybeSingle();
      return data;
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
  const otherName = iAmVendor ? "Customer" : (vendor ? vendor.shop_name : "Chat");
  const otherPhoto = !iAmVendor && vendor ? vendor.profile_image_url : null;
  const otherInitial = otherName.slice(0, 1).toUpperCase();
  const onFile = async (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    const path = "chat/" + Date.now() + "_" + f.name.replace(/[^a-zA-Z0-9.]+/g, "_");
    const { error } = await supabase.storage.from("${bucket}").upload(path, f);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("${bucket}").getPublicUrl(path);
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
    await supabase.from("messages").insert({ vendor_id: vendorId, buyer_id: buyerId, sender_id: session.user.id, sender_name: iAmVendor ? vendor.shop_name : (session.user.email || "Buyer"), body: body.trim() || (attach ? (attach.type === "video" ? "🎥 Video" : "📷 Photo") : ""), attachment_url: attach ? attach.url : null, attachment_type: attach ? attach.type : null });
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
  return (
    <div className="mx-auto flex max-w-2xl flex-col md:px-4 md:pt-6" style={{ height: "94vh" }} onClick={() => setSelectedId(null)}>
      <div className="flex items-center gap-3 rounded-t-2xl bg-[#075E54] p-3 text-white">
        {otherPhoto ? <img src={otherPhoto} alt="" className="size-10 rounded-full object-cover" /> : <span className="flex size-10 items-center justify-center rounded-full bg-white/20 font-display font-bold">{otherInitial}</span>}
        <div className="flex-1">
          <p className="font-semibold">{otherName}</p>
          <p className="text-[11px] opacity-80">{selectedMsg ? (isMine ? "✉️ Your message selected" : "📨 Their message selected") : "Tap any message for options"}</p>
        </div>
        {selectedMsg ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {selectedMsg.attachment_url ? <button onClick={doDownload} className="rounded-full p-2 hover:bg-white/10" title="Download"><Download className="size-5" /></button> : null}
            {isMine ? <button onClick={doEdit} className="rounded-full p-2 hover:bg-white/10" title="Edit"><Pencil className="size-5" /></button> : null}
            {isMine ? <button onClick={doDelete} className="rounded-full p-2 hover:bg-white/10" title="Delete"><Trash2 className="size-5" /></button> : null}
            <button onClick={() => setSelectedId(null)} className="rounded-full p-2 hover:bg-white/10"><X className="size-5" /></button>
          </div>
        ) : (
          <div className="text-xs opacity-70">💬</div>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ backgroundColor: "#efeae2", backgroundImage: "radial-gradient(#d8d2c6 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        {(msgs || []).map((m: any) => {
          const mine = m.sender_id === myId;
          const bubbleBg = mine ? "bg-[#d9fdd3]" : "bg-white";
          const ring = selectedId === m.id ? "ring-2 ring-[#25D366]" : "";
          const wrap = "flex " + (mine ? "justify-end" : "justify-start");
          return (
            <div key={m.id} className={wrap}>
              <div onClick={(e) => { e.stopPropagation(); setSelectedId(selectedId === m.id ? null : m.id); }} className={"cursor-pointer rounded-xl px-3 py-2 text-sm shadow-sm " + bubbleBg + " " + ring}>
                {m.attachment_url && m.attachment_type === "image" ? <img src={m.attachment_url} alt="" className="mb-1 max-h-64 rounded-lg" /> : null}
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
        {(msgs || []).length === 0 && <p className="pt-10 text-center text-sm text-muted-foreground">🔒 Say habari to start the chat.</p>}
        <div ref={endRef} />
      </div>
      <div className="rounded-b-2xl bg-[#f0f2f5] p-2" onClick={(e) => e.stopPropagation()}>
        {attach ? <div className="mb-2 flex items-center gap-2 rounded-lg bg-white p-2 text-xs"><span className="flex-1 truncate">{attach.type === "video" ? "🎥 Ready" : "📷 Ready"}</span><button onClick={() => setAttach(null)}><X className="size-4" /></button></div> : null}
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
`);
console.log('Chat thread rebuilt');

fs.writeFileSync('src/components/chat-fab.tsx', `import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
export function ChatFab() {
  const { session } = useSession();
  const { data: vendor } = useQuery({
    queryKey: ["fab-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, user_id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: unread } = useQuery({
    queryKey: ["fab-unread", session ? session.user.id : "anon", vendor ? vendor.id : "none"],
    enabled: !!session,
    queryFn: async () => {
      if (vendor) {
        const { data } = await supabase.from("messages").select("id, sender_id, read_at").eq("vendor_id", vendor.id).is("read_at", null);
        return (data || []).filter((m: any) => m.sender_id !== vendor.user_id).length;
      }
      const { data } = await supabase.from("messages").select("id, sender_id, read_at").eq("buyer_id", session!.user.id).is("read_at", null);
      return (data || []).filter((m: any) => m.sender_id !== session!.user.id).length;
    },
  });
  if (!session) return null;
  const n = unread || 0;
  return (
    <Link to={vendor ? "/chats" : "/orders"} aria-label="Chats" className="fixed bottom-24 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-105 md:bottom-8 md:right-8">
      <MessageCircle className="size-6" />
      {n > 0 ? <span className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold">{n > 99 ? "99+" : n}</span> : null}
    </Link>
  );
}
`);
console.log('FAB with unread badge');

fs.writeFileSync('src/routes/_authenticated/profile.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });
function Profile() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [photo, setPhoto] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const { data: vendor } = useQuery({
    queryKey: ["profile-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, shop_name, profile_image_url, auto_reply").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  if (!vendor) return <p className="py-16 text-center text-muted-foreground">Loading...</p>;
  const currentPhoto = photo || vendor.profile_image_url;
  const currentReply = photo === null && reply === "" && vendor.auto_reply ? vendor.auto_reply : reply;
  const save = async () => {
    const { error } = await supabase.from("vendors").update({ profile_image_url: currentPhoto, auto_reply: currentReply.trim() || null }).eq("id", vendor.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Profile saved");
  };
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><User className="size-7 text-accent" /> My profile</h1>
      <div className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-3">
          {currentPhoto ? <img src={currentPhoto} alt="" className="size-28 rounded-full object-cover ring-4 ring-accent/20" /> : <span className="flex size-28 items-center justify-center rounded-full bg-accent/15 font-display text-4xl font-bold text-accent-deep">{vendor.shop_name.slice(0, 1).toUpperCase()}</span>}
          <ImageUpload value={currentPhoto || ""} onChange={(url: string) => setPhoto(url)} />
        </div>
        <div>
          <Label>Shop name</Label>
          <Input value={vendor.shop_name} disabled />
          <p className="mt-1 text-xs text-muted-foreground">Change shop name from the main dashboard.</p>
        </div>
        <div>
          <Label>🤖 Auto-reply message</Label>
          <Textarea value={currentReply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="e.g. Hey! Thanks for reaching out. I will reply within 10 minutes. For urgent orders, call the number on the shop." maxLength={500} />
          <p className="mt-1 text-xs text-muted-foreground">Sent automatically when a new customer chats and you are offline. Leave blank to disable.</p>
        </div>
        <Button className="w-full" onClick={save}>Save profile</Button>
      </div>
    </div>
  );
}
`);
console.log('Profile page created');

let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!vendor.includes('/profile')) {
  vendor = vendor.split('<Button asChild size="sm" variant="outline"><Link to="/chats">Chats</Link></Button>').join('<Button asChild size="sm" variant="outline"><Link to="/chats">Chats</Link></Button>\n            <Button asChild size="sm" variant="outline"><Link to="/profile">My profile</Link></Button>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('Profile button added to vendor dashboard');
}

console.log('DONE');