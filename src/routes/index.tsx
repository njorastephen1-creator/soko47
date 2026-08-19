import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Package, ShieldCheck, Store, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { formatKes } from "@/lib/cart";
export const Route = createFileRoute("/")({ component: Home });
const FEATURED = [
  { county: "nairobi", name: "Kamukunji", desc: "Mali mali & utensils" },
  { county: "mombasa", name: "Kongowea", desc: "Coastal produce terminal" },
  { county: "kirinyaga", name: "Karatina", desc: "Fresh food, Mt Kenya" },
  { county: "uasin-gishu", name: "Eldoret Main", desc: "North Rift cereals" }
];
function LiveAds() {
  const { data } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, price_kes, unit, image_url, vendors!inner(shop_name, market_name, status)").eq("vendors.status", "active").order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(6);
      return data || [];
    },
  });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!data || data.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % data.length), 4000);
    return () => clearInterval(t);
  }, [data]);
  const p = data ? data[i] : undefined;
  if (!p) return null;
  return (
    <div className="rounded-3xl border border-background/10 bg-background/10 p-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Featured today · live from the market</p>
      <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="ad-in mt-3 flex items-center gap-4 rounded-2xl bg-card p-3 shadow-lift">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
          {p.image_url ? <img src={p.image_url} alt={p.title} className="size-full object-cover" /> : <Package className="m-auto size-8 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{p.title}</p>
          <p className="truncate text-xs text-muted-foreground">{p.vendors ? p.vendors.shop_name + " · " + p.vendors.market_name : ""}</p>
          <p className="font-display text-lg font-bold text-accent-deep">{formatKes(Number(p.price_kes))}<span className="text-xs font-normal text-muted-foreground">/{p.unit}</span></p>
        </div>
      </Link>
      <div className="mt-3 flex justify-center gap-1.5">
        {(data || []).map((d, idx) => (
          <button key={d.id} onClick={() => setI(idx)} aria-label="next ad" className={"h-1.5 rounded-full transition-all " + (idx === i ? "w-6 bg-accent" : "w-1.5 bg-background/30")} />
        ))}
      </div>
    </div>
  );
}
function Home() {
  const { data: fresh } = useQuery({
    queryKey: ["fresh"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors!inner(shop_name, slug, county_slug, market_name, status)").eq("vendors.status", "active").order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(8);
      return data as ProductRow[];
    },
  });
  return (
    <div>
      <section className="hero-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"><MapPin className="size-3.5" /> 47 counties · 140+ markets</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">Kenya's great markets, <span className="text-accent">now open online.</span></h1>
            <p className="mt-5 max-w-xl text-lg opacity-90">From Kamukunji plastics and Gikomba fashion to Kongowea produce and Mwea pishori rice — buy directly from the traders who run the stalls, wherever you are.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/browse" className="flex items-center gap-2 rounded-xl bg-background px-6 py-3 font-semibold text-foreground hover:opacity-90">Start shopping <ArrowRight className="size-4" /></Link>
              <Link to="/sell" className="warm-surface rounded-xl px-6 py-3 font-semibold hover:opacity-90">Open a trader shop</Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <LiveAds />
            <div className="grid grid-cols-2 gap-3">
              {FEATURED.map((m) => (
                <Link key={m.name} to="/markets/$county" params={{ county: m.county }} className="rounded-2xl bg-background/10 p-4 backdrop-blur transition-colors hover:bg-background/20">
                  <p className="font-display font-bold">{m.name}</p>
                  <p className="text-sm opacity-80">{m.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">Fresh listings</h2>
          <Link to="/browse" className="text-sm font-semibold text-accent-deep hover:underline">View all</Link>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">{(fresh || []).map((p) => (<ProductCard key={p.id} product={p} />))}</div>
      </section>
      <section className="border-y border-border bg-card py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold">Shop by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to="/browse" search={{ category: c.slug }} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-soft">
                <c.icon className="size-6 text-accent-deep" />
                <span className="text-xs font-medium leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold">Markets by county</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COUNTIES.slice(0, 10).map((c) => (
            <Link key={c.slug} to="/markets/$county" params={{ county: c.slug }} className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft">
              <p className="font-semibold">{c.county}</p>
              <p className="text-xs text-muted-foreground">{Array.isArray((c as any).markets) ? (c as any).markets.length + " markets" : "View markets"}</p>
            </Link>
          ))}
        </div>
        <Link to="/markets" className="mt-4 inline-block text-sm font-semibold text-accent-deep hover:underline">Full directory — all 47 counties</Link>
      </section>
      <section className="hero-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
          <div className="rounded-2xl bg-background/10 p-6 backdrop-blur"><ShieldCheck className="size-6 text-accent" /><p className="mt-3 font-display font-bold">Verified traders only</p><p className="mt-1 text-sm opacity-85">Every shop is approved by Soko47 before it can sell. No fakes, no ghosts.</p></div>
          <div className="rounded-2xl bg-background/10 p-6 backdrop-blur"><Truck className="size-6 text-accent" /><p className="mt-3 font-display font-bold">Delivery or pickup</p><p className="mt-1 text-sm opacity-85">Boda riders, matatu parcels or walk to the stall — your choice at checkout.</p></div>
          <div className="rounded-2xl bg-background/10 p-6 backdrop-blur"><Store className="size-6 text-accent" /><p className="mt-3 font-display font-bold">A shop in 3 minutes</p><p className="mt-1 text-sm opacity-85">Traders open a digital stall free for 3 weeks, then from KSh 300/month.</p></div>
        </div>
      </section>
    </div>
  );
}