import fs from 'fs';
if (!fs.existsSync('api')) fs.mkdirSync('api');
fs.writeFileSync('api/sms.js', `export default async function handler(req, res) {
  const { phone, message } = req.body || {};
  const u = process.env.AT_USERNAME, k = process.env.AT_API_KEY;
  if (!u || !k) { res.status(200).json({ skipped: true }); return; }
  try {
    let ph = String(phone || "").replace(/\\s+/g, "");
    if (ph.startsWith("0")) ph = "254" + ph.slice(1);
    const r = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: String(k), Accept: "application/json" },
      body: JSON.stringify({ username: String(u), to: [ph], message: String(message) })
    });
    res.status(r.status).json(await r.json().catch(() => ({})));
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
`);
fs.writeFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const send = async () => {
    if (!body.trim()) return;
    await supabase.from("messages").insert({ vendor_id: vendorId, buyer_id: buyerId, sender_id: session.user.id, sender_name: iAmVendor ? vendor.shop_name : (session.user.email || "Buyer"), body: body.trim() });
    setBody("");
    qc.invalidateQueries();
  };
  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 pt-8" style={{ height: "88vh" }}>
      <h1 className="font-display text-xl font-bold">{iAmVendor ? "Customer chat" : vendor ? vendor.shop_name : "Chat"}</h1>
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-3xl border border-border bg-card p-4">
        {(msgs || []).map((m: any) => (
          <div key={m.id} className={"flex " + (m.sender_id === session.user.id ? "justify-end" : "justify-start")}>
            <div className={"max-w-[75%] rounded-2xl px-3 py-2 text-sm " + (m.sender_id === session.user.id ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <p>{m.body}</p>
              <p className="mt-1 text-[10px] opacity-70">{m.sender_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        {(msgs || []).length === 0 && <p className="text-center text-sm text-muted-foreground">Say habari! Start the conversation.</p>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 py-3">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <Button onClick={send}><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
`);
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
      const { data } = await supabase.from("vendors").select("id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: msgs } = useQuery({
    queryKey: ["inbox-msgs", vendor ? vendor.id : "none"],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("vendor_id", vendor!.id).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });
  const threads: any[] = [];
  (msgs || []).forEach((m: any) => {
    if (!threads.find((t) => t.buyer_id === m.buyer_id)) threads.push(m);
  });
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MessageCircle className="size-7 text-accent" /> Customer chats</h1>
      <div className="mt-6 space-y-2">
        {threads.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet - buyers can chat you from any product page.</p>}
        {threads.map((t: any) => (
          <Link key={t.buyer_id} to="/chat/$vendorId/$buyerId" params={{ vendorId: t.vendor_id, buyerId: t.buyer_id }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-deep">{(t.sender_name || "?").slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.sender_name || "Customer"}</p>
              <p className="truncate text-xs text-muted-foreground">{t.body}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
`);
fs.writeFileSync('src/routes/_authenticated/rider.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/_authenticated/rider")({ component: RiderPage });
function RiderPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", area: "" });
  const { data: rider } = useQuery({
    queryKey: ["my-rider", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("riders").select("*").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: open } = useQuery({
    queryKey: ["rider-open"],
    enabled: !!rider,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("delivery_status", "requested").order("created_at", { ascending: false });
      return data || [];
    },
  });
  const { data: mine } = useQuery({
    queryKey: ["rider-mine", rider ? rider.id : "none"],
    enabled: !!rider,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("rider_id", rider!.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  if (!session) return null;
  if (!rider) return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Bike className="size-10 text-accent" />
      <h1 className="mt-2 font-display text-2xl font-bold">Ride & earn with Soko47</h1>
      <p className="mt-1 text-sm text-muted-foreground">Deliver orders, earn KSh 135 per drop (platform keeps KSh 15). Paid straight to your M-Pesa.</p>
      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XX..." /></div>
        <div><Label>Area / town</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Nakuru town" /></div>
        <Button className="w-full" onClick={async () => {
          if (form.name.trim().length < 2 || form.phone.trim().length < 10) return toast.error("Fill name and valid phone");
          const { error } = await supabase.from("riders").insert({ user_id: session.user.id, name: form.name.trim(), phone: form.phone.trim(), area: form.area.trim() || null });
          if (error) return toast.error(error.message);
          qc.invalidateQueries();
          toast.success("Karibu rider! You are live.");
        }}>Become a rider</Button>
      </div>
    </div>
  );
  const accept = async (o: any) => {
    const { error } = await supabase.from("orders").update({ rider_id: rider.id, delivery_status: "accepted" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order accepted - call the buyer and go!");
  };
  const delivered = async (o: any) => {
    const { error } = await supabase.from("orders").update({ delivery_status: "delivered", status: "fulfilled" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Delivered! KSh 135 earned.");
  };
  const doneCount = (mine || []).filter((o: any) => o.delivery_status === "delivered").length;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Bike className="size-7 text-accent" /> Rider dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rider.name} · {rider.area} · Earned so far: {formatKes(doneCount * 135)}</p>
      <h2 className="mt-6 font-semibold">Open deliveries (KSh 150 fee)</h2>
      <div className="mt-2 space-y-2">
        {(open || []).length === 0 && <p className="text-sm text-muted-foreground">No open requests right now.</p>}
        {(open || []).map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{o.buyer_name} · <a className="underline" href={"tel:" + o.buyer_phone}>{o.buyer_phone}</a></p>
            <p className="text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>
            <Button size="sm" className="mt-2" onClick={() => accept(o)}>Accept delivery</Button>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-semibold">My deliveries</h2>
      <div className="mt-2 space-y-2">
        {(mine || []).map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between text-xs text-muted-foreground"><span>{new Date(o.created_at).toLocaleString()}</span><span className="font-semibold">{o.delivery_status}</span></div>
            <p className="mt-1 text-sm font-semibold">{o.buyer_name} · {o.delivery_location}</p>
            {o.delivery_status === "accepted" ? <Button size="sm" className="mt-2" onClick={() => delivered(o)}>Mark delivered</Button> : null}
          </div>
        ))}
        {(mine || []).length === 0 && <p className="text-sm text-muted-foreground">Accept your first delivery above.</p>}
      </div>
    </div>
  );
}
`);
console.log('Created chat + rider + sms engines');
let checkout = fs.readFileSync('src/routes/checkout.tsx', 'utf8');
if (!checkout.includes('needRider')) {
  checkout = checkout.split('  const [saving, setSaving] = useState(false);').join('  const [saving, setSaving] = useState(false);\n  const [needRider, setNeedRider] = useState(false);');
  checkout = checkout.split('        <Button type="submit" size="lg" className="mt-6 w-full" disabled={saving}>').join('        <label className="mt-4 flex items-center gap-2 rounded-md bg-secondary p-3 text-sm font-medium"><input type="checkbox" checked={needRider} onChange={(e) => setNeedRider(e.target.checked)} /> 🛵 I need a Soko47 rider (+KSh 150)</label>\n        <Button type="submit" size="lg" className="mt-6 w-full" disabled={saving}>');
  checkout = checkout.split('total_kes: total }).select().single();').join('total_kes: total, delivery_fee_kes: needRider ? 150 : 0, delivery_status: needRider ? "requested" : "none" }).select().single();');
  fs.writeFileSync('src/routes/checkout.tsx', checkout);
  console.log('Checkout: rider option');
}
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!vendor.includes('rider_id')) {
  vendor = vendor.split('<p className="text-xs text-muted-foreground">{g.delivery_location || "Pickup at stall"}</p>').join('<p className="text-xs text-muted-foreground">{g.delivery_location || "Pickup at stall"}</p>\n              {g.delivery_status && g.delivery_status !== "none" ? <p className="text-xs font-semibold text-accent-deep">🛵 Delivery: {g.delivery_status}</p> : null}');
  vendor = vendor.split('<div className="flex gap-2">').join('<div className="flex flex-wrap gap-2">\n                    <Button asChild size="sm" variant="outline"><Link to="/chat/$vendorId/$buyerId" params={{ vendorId: vendor.id, buyerId: g.buyer_id }}>💬 Chat</Link></Button>');
  vendor = vendor.split('{vendor.subscription_plan === "pro" ? <Button asChild size="sm" variant="outline"><Link to="/pro">Pro Studio</Link></Button> : null}').join('{vendor.subscription_plan === "pro" ? <Button asChild size="sm" variant="outline"><Link to="/pro">Pro Studio</Link></Button> : null}\n            <Button asChild size="sm" variant="outline"><Link to="/chats">Chats</Link></Button>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('Vendor: chat + delivery badges');
}
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
if (!prod.includes('Chat</Link>')) {
  if (!prod.includes('useSession')) {
    prod = prod.split('import { supabase } from "@/integrations/supabase/client";').join('import { supabase } from "@/integrations/supabase/client";\nimport { useSession } from "@/lib/use-session";');
    prod = prod.split('function ProductPage() {').join('function ProductPage() {\n  const { session } = useSession();');
  }
  prod = prod.split('💳 M-Pesa: {product.vendors.pay_phone} (tap to copy)</button> : null}').join('💳 M-Pesa: {product.vendors.pay_phone} (tap to copy)</button> : null}\n              {session ? <Link to="/chat/$vendorId/$buyerId" params={{ vendorId: product.vendors.id, buyerId: session.user.id }} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"><MessageCircle className="size-3.5" /> Chat</Link> : null}');
  fs.writeFileSync('src/routes/product.$id.tsx', prod);
  console.log('Product page: chat button');
}
let orders = fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8');
if (!orders.includes('delivery_status')) {
  orders = orders.split('              <div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>{formatKes(Number(o.total_kes))}</span></div>').join('              <div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>{formatKes(Number(o.total_kes))}</span></div>\n              {o.delivery_status && o.delivery_status !== "none" ? <p className="mt-1 text-xs font-semibold text-accent-deep">🛵 Delivery: {o.delivery_status}</p> : null}');
  orders = orders.split('                <Button asChild size="sm" variant="outline"><Link to="/receipt/$id" params={{ id: o.id }}><ReceiptText className="size-4" /> Receipt</Link></Button>').join('                {lines[0] && session ? <Button asChild size="sm" variant="outline"><Link to="/chat/$vendorId/$buyerId" params={{ vendorId: lines[0].vendor_id, buyerId: session.user.id }}><MessageCircle className="size-4" /> Chat</Link></Button> : null}\n                <Button asChild size="sm" variant="outline"><Link to="/receipt/$id" params={{ id: o.id }}><ReceiptText className="size-4" /> Receipt</Link></Button>');
  if (!orders.includes('MessageCircle')) orders = orders.split('import { ReceiptText, Trash2 } from "lucide-react";').join('import { MessageCircle, ReceiptText, Trash2 } from "lucide-react";');
  fs.writeFileSync('src/routes/_authenticated/orders.tsx', orders);
  console.log('Orders: chat + delivery status');
}
let pay = fs.readFileSync('src/routes/pay.$id.tsx', 'utf8');
if (!pay.includes('api/sms')) {
  pay = pay.split('          toast.success("Payment received!");').join('          toast.success("Payment received!");\n          if (g.v.pay_phone) fetch("/api/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: g.v.pay_phone, message: "Soko47: paid order " + id.slice(0, 6) + " worth " + formatKes(g.total) + " from " + order.buyer_name }) }).catch(() => {});');
  fs.writeFileSync('src/routes/pay.$id.tsx', pay);
  console.log('SMS on payment wired');
}
console.log('DONE: WAVE 1');