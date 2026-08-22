import fs from 'fs';
fs.writeFileSync('src/routes/_authenticated/chats.tsx', `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Store } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useMyVendor } from "@/lib/my-vendor";
import { Button } from "@/components/ui/button";
function when(t: string) {
  const d = new Date(t);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return "Yesterday";
  return d.toLocaleDateString();
}
export const Route = createFileRoute("/_authenticated/chats")({ component: ChatsInbox });
function ChatsInbox() {
  const { session } = useSession();
  const { vendors } = useMyVendor();
  const [shopId, setShopId] = useState<string | null>(null);
  const ids = (vendors || []).map((v: any) => v.id);
  const { data: shopMsgs } = useQuery({
    queryKey: ["inbox-shop-msgs", ids.join(",")],
    enabled: !!session && ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").in("vendor_id", ids).order("created_at", { ascending: false });
      return data || [];
    },
  });
  const { data: buyerMsgs } = useQuery({
    queryKey: ["inbox-buyer-msgs", session ? session.user.id : "anon"],
    enabled: !!session && (!vendors || vendors.length === 0),
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*, vendors(shop_name, profile_image_url, display_name)").eq("buyer_id", session!.user.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  if (!session) return null;
  const isVendor = (vendors || []).length > 0;
  const active = (vendors || []).find((v: any) => v.id === shopId);
  const shops = (vendors || []).map((v: any) => {
    const msgs = (shopMsgs || []).filter((m: any) => m.vendor_id === v.id);
    return { ...v, unread: msgs.filter((m: any) => m.sender_id !== v.user_id && !m.read_at).length, lastAt: msgs[0] ? msgs[0].created_at : null, lastBody: msgs[0] ? msgs[0].body : "" };
  }).sort((a: any, b: any) => (b.lastAt ? new Date(b.lastAt).getTime() : 0) - (a.lastAt ? new Date(a.lastAt).getTime() : 0));
  const threads: any = {};
  (shopMsgs || []).filter((m: any) => m.vendor_id === shopId).forEach((m: any) => {
    if (!threads[m.buyer_id]) threads[m.buyer_id] = { buyerId: m.buyer_id, name: null, last: m.body, lastAt: m.created_at, unread: 0 };
    if (m.sender_id !== (active ? active.user_id : "-")) {
      if (!threads[m.buyer_id].name) threads[m.buyer_id].name = m.sender_name || "Customer";
      if (!m.read_at) threads[m.buyer_id].unread += 1;
    }
  });
  const threadList = Object.values(threads).sort((a: any, b: any) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  const buyerThreads: any = {};
  (buyerMsgs || []).forEach((m: any) => {
    if (!buyerThreads[m.vendor_id]) buyerThreads[m.vendor_id] = { vendorId: m.vendor_id, buyerId: session.user.id, name: m.vendors ? (m.vendors.display_name || m.vendors.shop_name) : "Trader", photo: m.vendors ? m.vendors.profile_image_url : null, last: m.body, lastAt: m.created_at, unread: 0 };
    if (m.sender_id !== session.user.id && !m.read_at) buyerThreads[m.vendor_id].unread += 1;
  });
  const buyerList = Object.values(buyerThreads).sort((a: any, b: any) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">{active ? <button onClick={() => setShopId(null)} className="flex items-center gap-1 text-lg text-muted-foreground"><ChevronLeft className="size-5" /> Back</button> : null} Chats</h1>
        <Button asChild size="sm" variant="outline"><Link to="/profile">My profile</Link></Button>
      </div>
      {!isVendor ? (
        <div className="mt-6 space-y-2">
          {buyerList.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet - chat a trader from any product page.</p>}
          {buyerList.map((t: any) => (
            <Link key={t.vendorId} to={"/chat/" + t.vendorId + "/" + t.buyerId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary">
              {t.photo ? <img src={t.photo} alt="" className="size-12 rounded-full object-cover" /> : <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-deep">{(t.name || "?").slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{t.name}</p><p className="shrink-0 text-[11px] text-muted-foreground">{when(t.lastAt)}</p></div>
                <div className="flex items-center justify-between gap-2"><p className="truncate text-sm text-muted-foreground">{t.last}</p>{t.unread > 0 ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-white">{t.unread}</span> : null}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : !active ? (
        <div className="mt-6 space-y-2">
          {shops.map((s: any) => (
            <button key={s.id} onClick={() => setShopId(s.id)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:bg-secondary">
              {s.profile_image_url ? <img src={s.profile_image_url} alt="" className="size-12 rounded-full object-cover" /> : <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-deep"><Store className="size-5" /></span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{s.shop_name}</p><p className="shrink-0 text-[11px] text-muted-foreground">{s.lastAt ? when(s.lastAt) : ""}</p></div>
                <div className="flex items-center justify-between gap-2"><p className="truncate text-sm text-muted-foreground">{s.lastBody || "No messages yet"}</p>{s.unread > 0 ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-white">{s.unread}</span> : null}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">{active.shop_name} - attend to each customer</p>
          {threadList.length === 0 && <p className="text-sm text-muted-foreground">No customer conversations yet.</p>}
          {threadList.map((t: any) => (
            <Link key={t.buyerId} to={"/chat/" + active.id + "/" + t.buyerId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-deep">{(t.name || "C").slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{t.name || "Customer"}</p><p className="shrink-0 text-[11px] text-muted-foreground">{when(t.lastAt)}</p></div>
                <div className="flex items-center justify-between gap-2"><p className="truncate text-sm text-muted-foreground">{t.last}</p>{t.unread > 0 ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-white">{t.unread}</span> : null}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
`);
console.log('Inbox: shop-first WhatsApp-Web style');
let fab = fs.readFileSync('src/components/chat-fab.tsx', 'utf8');
if (!fab.includes('last_seen')) {
  fab = fab.split('import { Link } from "@tanstack/react-router";').join('import { useEffect } from "react";\nimport { Link } from "@tanstack/react-router";');
  fab = fab.split('export function ChatFab() {').join('export function ChatFab() {\n  const { session } = useSession();\n  useEffect(() => {\n    if (!session) return;\n    const beat = () => { supabase.from("user_profiles").upsert({ user_id: session.user.id, last_seen: new Date().toISOString() }); };\n    beat();\n    const t = setInterval(beat, 60000);\n    return () => clearInterval(t);\n  }, [session]);');
  fab = fab.split('export function ChatFab() {\n  const { session } = useSession();\n  const { session } = useSession();').join('export function ChatFab() {\n  const { session } = useSession();');
  fs.writeFileSync('src/components/chat-fab.tsx', fab);
  console.log('Presence heartbeat added');
}
let chat = fs.readFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', 'utf8');
if (!chat.includes('vendorUserProf')) {
  chat = chat.split('.select("display_name, photo_url").eq("user_id", buyerId)').join('.select("display_name, photo_url, last_seen").eq("user_id", buyerId)');
  chat = chat.split('  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs]);').join(`  const { data: vendorUserProf } = useQuery({
    queryKey: ["vendor-user-prof", vendor ? vendor.user_id : "none"],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from("user_profiles").select("last_seen").eq("user_id", vendor!.user_id).maybeSingle();
      return data || null;
    },
  });
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs]);`);
  chat = chat.split('const otherPhoto = iAmVendor ? (buyerProf ? buyerProf.photo_url : null) : (vendor ? vendor.profile_image_url : null);').join('const otherPhoto = iAmVendor ? (buyerProf ? buyerProf.photo_url : null) : (vendor ? vendor.profile_image_url : null);\n  const otherLastSeen = iAmVendor ? (buyerProf ? buyerProf.last_seen : null) : (vendorUserProf ? vendorUserProf.last_seen : null);\n  const onlineNow = otherLastSeen && Date.now() - new Date(otherLastSeen).getTime() < 120000;');
  chat = chat.split('{selectedMsg ? (isMine ? "Your message selected" : "Their message selected") : "Long-press / right-click a message"}').join('{selectedMsg ? (isMine ? "Your message selected" : "Their message selected") : (onlineNow ? "online" : (otherLastSeen ? "last seen " + new Date(otherLastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Long-press / right-click a message"))}');
  chat = chat.split('{mine ? (m.read_at ? <CheckCheck className="size-3.5 text-[#53bdeb]" /> : <Check className="size-3.5 text-muted-foreground" />) : null}').join('{mine ? (m.read_at ? <CheckCheck className="size-3.5 text-[#53bdeb]" /> : (otherLastSeen && new Date(otherLastSeen).getTime() > new Date(m.created_at).getTime() ? <CheckCheck className="size-3.5 text-muted-foreground" /> : <Check className="size-3.5 text-muted-foreground" />)) : null}');
  fs.writeFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', chat);
  console.log('Ticks: 3-state + online/last seen');
}
console.log('DONE');