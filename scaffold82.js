import fs from 'fs';
fs.writeFileSync('src/components/home-ads.tsx', `import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
export function HomeAds() {
  const { data } = useQuery({
    queryKey: ["home-ads"],
    queryFn: async () => {
      const { data: ads } = await supabase.from("ads").select("*, vendors(id, shop_name, slug, subscription_plan, status)").eq("active", true);
      return (ads || []).filter((a: any) => a.vendors && a.vendors.subscription_plan === "pro" && a.vendors.status === "active");
    },
  });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!data || data.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % data.length), 5000);
    return () => clearInterval(t);
  }, [data]);
  if (!data || data.length === 0) return null;
  const ad = data[i % data.length];
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <div className="relative overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-r from-accent/15 to-primary/10">
        <div className="flex items-center gap-4 p-4">
          {ad.image_url ? <img src={ad.image_url} alt="" className="size-16 rounded-xl object-cover" /> : null}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent-deep">Sponsored · {ad.vendors.shop_name}</p>
            <p className="truncate font-display text-lg font-bold">{ad.title}</p>
          </div>
          <Link to={"/shop/" + ad.vendors.slug} className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Visit shop</Link>
        </div>
        {data.length > 1 ? <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">{data.map((_: any, x: number) => (<span key={x} className={"size-1.5 rounded-full " + (x === i % data.length ? "bg-accent" : "bg-border")}></span>))}</div> : null}
      </div>
    </div>
  );
}
`);
console.log('Created homepage ad player');
fs.writeFileSync('src/routes/_authenticated/pro.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Megaphone, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
export const Route = createFileRoute("/_authenticated/pro")({ component: ProStudio });
function ProStudio() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [adImg, setAdImg] = useState("");
  const { data: vendor } = useQuery({
    queryKey: ["pro-vendor", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: stats } = useQuery({
    queryKey: ["pro-stats", vendor ? vendor.id : "none"],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("unit_price_kes, quantity, orders(payment_status)").eq("vendor_id", vendor!.id);
      return data || [];
    },
  });
  const { data: myAds } = useQuery({
    queryKey: ["pro-ads", vendor ? vendor.id : "none"],
    enabled: !!vendor,
    queryFn: async () => {
      const { data } = await supabase.from("ads").select("*").eq("vendor_id", vendor!.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  if (!vendor) return <p className="py-16 text-center text-muted-foreground">Loading...</p>;
  if (vendor.subscription_plan !== "pro") return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <Sparkles className="mx-auto size-12 text-accent" />
      <h1 className="mt-3 font-display text-2xl font-bold">Pro Studio is for Pro traders</h1>
      <p className="mt-2 text-sm text-muted-foreground">Upgrade to KSh 999/month from your dashboard to unlock homepage ads, analytics and follower broadcasts.</p>
    </div>
  );
  const paidRows = (stats || []).filter((s: any) => s.orders && s.orders.payment_status === "paid");
  const revenue = paidRows.reduce((s: number, r: any) => s + Number(r.unit_price_kes) * r.quantity, 0);
  const broadcast = async () => {
    if (msg.trim().length < 3) return toast.error("Write your message first");
    const { data: fans } = await supabase.from("follows").select("user_id").eq("vendor_id", vendor.id);
    if (!fans || fans.length === 0) return toast.error("No followers yet - share your shop link");
    const rows = fans.map((f: any) => ({ user_id: f.user_id, title: vendor.shop_name + " says:", body: msg.trim(), link: "/shop/" + vendor.slug }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) return toast.error(error.message);
    setMsg("");
    toast.success("Broadcast sent to " + fans.length + " followers");
  };
  const saveAd = async () => {
    if (adTitle.trim().length < 3) return toast.error("Give your ad a headline");
    const { error } = await supabase.from("ads").insert({ vendor_id: vendor.id, title: adTitle.trim(), image_url: adImg || null });
    if (error) return toast.error(error.message);
    setAdTitle("");
    setAdImg("");
    qc.invalidateQueries();
    toast.success("Ad is live on the homepage!");
  };
  const killAd = async (id: string) => {
    await supabase.from("ads").delete().eq("id", id);
    qc.invalidateQueries();
    toast.success("Ad removed");
  };
  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Sparkles className="size-7 text-accent" /> Pro Studio</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your KSh 999 superpowers.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold"><BarChart3 className="size-4 text-accent-deep" /> Sales analytics</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary p-3"><p className="font-display text-xl font-extrabold">{formatKes(revenue)}</p><p className="text-xs text-muted-foreground">Paid revenue</p></div>
            <div className="rounded-2xl bg-secondary p-3"><p className="font-display text-xl font-extrabold">{paidRows.length}</p><p className="text-xs text-muted-foreground">Paid order lines</p></div>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Megaphone className="size-4 text-accent-deep" /> Broadcast to followers</h2>
          <div className="mt-3 space-y-2">
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Fresh stock Friday - first 10 get discount!" />
            <Button onClick={broadcast} className="w-full">Send to all followers</Button>
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-5">
        <h2 className="font-semibold">Homepage Ad Studio</h2>
        <p className="mt-1 text-xs text-muted-foreground">Your ad plays on the homepage for ALL visitors - auto-rotating every 5 seconds.</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1"><Label>Ad headline</Label><Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="e.g. Best prices on electronics!" /></div>
          <ImageUpload value="" onChange={(url: string) => setAdImg(url)} />
          <Button onClick={saveAd}>Launch ad</Button>
        </div>
        <div className="mt-4 space-y-2">
          {(myAds || []).map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
              {a.image_url ? <img src={a.image_url} alt="" className="size-10 rounded-lg object-cover" /> : null}
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{a.title}</p>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => killAd(a.id)}><Trash2 className="size-4" /></Button>
            </div>
          ))}
          {(myAds || []).length === 0 && <p className="text-sm text-muted-foreground">No ads yet - launch your first one above.</p>}
        </div>
      </div>
    </div>
  );
}
`);
console.log('Created Pro Studio');
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('HomeAds')) {
  chrome = chrome.split('import { useLive } from "@/lib/live";').join('import { useLive } from "@/lib/live";\nimport { HomeAds } from "@/components/home-ads";');
  chrome = chrome.split('</header>').join('{typeof window !== "undefined" && window.location.pathname === "/" ? <HomeAds /> : null}</header>');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Ad player mounted on homepage');
}
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let n = 0;
if (vendor.includes('const paySubscription = async () => {')) {
  vendor = vendor.split('const paySubscription = async () => {').join('const paySubscription = async (amount: number, plan: string) => {');
  n++;
}
if (vendor.includes('stkPush(payPhone.trim(), 300, "SUB-"')) {
  vendor = vendor.split('stkPush(payPhone.trim(), 300, "SUB-"').join('stkPush(payPhone.trim(), amount, "SUB-"');
  n++;
}
if (vendor.includes('subscription_plan: "monthly"')) {
  vendor = vendor.split('subscription_plan: "monthly"').join('subscription_plan: plan');
  n++;
}
if (vendor.includes('"Pay KSh 300 with M-Pesa"')) {
  vendor = vendor.split('<Button onClick={paySubscription} disabled={paying}>{paying ? "Waiting for PIN..." : "Pay KSh 300 with M-Pesa"}</Button>').join('<Button variant="outline" onClick={() => paySubscription(499, "starter")} disabled={paying}>{paying ? "Waiting..." : "Starter · KSh 499/mo"}</Button>\n          <Button onClick={() => paySubscription(999, "pro")} disabled={paying}>{paying ? "Waiting..." : "Pro · KSh 999/mo"}</Button>');
  n++;
}
if (vendor.includes('KSh 300/month to Soko47')) {
  vendor = vendor.split('KSh 300/month to Soko47 - your shop unlocks the second M-Pesa confirms.').join('Starter KSh 499 (25 products) · Pro KSh 999 (unlimited + homepage ads + analytics). Unlocks the second M-Pesa confirms.');
  n++;
}
if (!vendor.includes('Pro Studio')) {
  vendor = vendor.split('<Button asChild size="sm"><Link to="/pos">POS & Receipts</Link></Button>').join('<Button asChild size="sm"><Link to="/pos">POS & Receipts</Link></Button>\n            {vendor.subscription_plan === "pro" ? <Button asChild size="sm" variant="outline"><Link to="/pro">Pro Studio</Link></Button> : null}');
  n++;
}
fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
console.log('Vendor patches:', n);
console.log('DONE: tier engine');