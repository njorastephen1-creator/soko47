import fs from 'fs';
let css = fs.readFileSync('src/styles.css', 'utf8');
if (!css.includes('ad-in')) {
  css = css.split('@utility shadow-lift { box-shadow: var(--shadow-lift); }').join('@utility shadow-lift { box-shadow: var(--shadow-lift); }\n@keyframes ad-in { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }\n.ad-in { animation: ad-in 0.6s ease both; }');
  fs.writeFileSync('src/styles.css', css);
  console.log('Patched styles.css (ad animation)');
}
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let vChanged = false;
if (vendor.includes('update({ plan: "trial", plan_started_at: new Date().toISOString() })')) {
  vendor = vendor.split('update({ plan: "trial", plan_started_at: new Date().toISOString() })').join('update({ plan: "trial", plan_started_at: new Date().toISOString(), status: "active" })');
  vendor = vendor.split('update({ plan: slug, plan_started_at: new Date().toISOString() })').join('update({ plan: slug, plan_started_at: new Date().toISOString(), status: "active" })');
  vendor = vendor.split('<h2 className="text-xl font-semibold">Your plan</h2>').join('<h2 className="text-xl font-semibold">Your plan</h2>\n      {vendor.status === "blocked" && (<div className="mt-3 rounded-xl border-2 border-destructive bg-destructive/10 p-4 text-sm font-medium text-destructive">Your shop is BLOCKED because your subscription expired. Pay below to reactivate instantly.</div>)}');
  vChanged = true;
}
if (vChanged) { fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor); console.log('Patched vendor.tsx (paywall + unblock on pay)'); }
const files = {};
files['src/routes/index.tsx'] = `import { Link } from "@tanstack/react-router";
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
      const { data } = await supabase.from("products").select("id, title, price_kes, unit, image_url, vendors!inner(shop_name, market_name, status)").eq("vendors.status", "active").order("created_at", { ascending: false }).limit(6);
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
      const { data } = await supabase.from("products").select("*, vendors!inner(shop_name, slug, county_slug, market_name, status)").eq("vendors.status", "active").order("created_at", { ascending: false }).limit(8);
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
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{(fresh || []).map((p) => (<ProductCard key={p.id} product={p} />))}</div>
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
              <p className="text-xs text-muted-foreground">{c.markets.length} markets</p>
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
}`;
files['src/routes/browse.tsx'] = `import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { FollowButton } from "@/components/follow-button";
export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
    county: typeof search.county === "string" ? search.county : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    sub: typeof search.sub === "string" ? search.sub : undefined
  }),
});
function BrowsePage() {
  const { category, county, q, sub } = Route.useSearch();
  const navigate = useNavigate();
  const setSearch = (patch: Record<string, string | undefined>) => navigate({ to: "/browse", search: { category, county, q, sub, ...patch } });
  const activeCat = CATEGORIES.find((c) => c.slug === category);
  const { data: products } = useQuery({
    queryKey: ["browse", category, county, q, sub],
    queryFn: async () => {
      let query = supabase.from("products").select("*, vendors!inner(shop_name, slug, county_slug, market_name, status)").eq("vendors.status", "active").order("created_at", { ascending: false }).limit(60);
      if (category) query = query.eq("category_slug", category);
      if (sub) query = query.eq("subcategory", sub);
      if (county) query = query.eq("vendors.county_slug", county);
      if (q) query = query.or("title.ilike.%" + q + "%,description.ilike.%" + q + "%,category_slug.ilike.%" + q + "%,subcategory.ilike.%" + q + "%");
      const { data, error } = await query;
      if (error) throw error;
      return data as ProductRow[];
    },
  });
  const { data: shops } = useQuery({
    queryKey: ["shops-search", q],
    enabled: !!q,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("status", "active").or("shop_name.ilike.%" + q + "%,market_name.ilike.%" + q + "%").limit(6);
      return data || [];
    },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">{q ? "Results for " + q : "Shop all goods"}</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setSearch({ category: undefined, sub: undefined })} className={"rounded-full border px-4 py-1.5 text-sm " + (!category ? "bg-secondary font-semibold" : "border-border bg-card")}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c.slug} onClick={() => setSearch({ category: c.slug, sub: undefined })} className={"rounded-full border px-4 py-1.5 text-sm " + (category === c.slug ? "bg-secondary font-semibold" : "border-border bg-card")}>{c.name}</button>
        ))}
      </div>
      {activeCat && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setSearch({ sub: undefined })} className={"rounded-full border px-3 py-1 text-xs " + (!sub ? "bg-secondary" : "border-border bg-card")}>All {activeCat.name}</button>
          {activeCat.subs.map((s) => (
            <button key={s} onClick={() => setSearch({ sub: s })} className={"rounded-full border px-3 py-1 text-xs " + (sub === s ? "bg-secondary" : "border-border bg-card")}>{s}</button>
          ))}
        </div>
      )}
      <div className="mt-4">
        <select value={county ?? ""} onChange={(e) => setSearch({ county: e.target.value || undefined })} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          <option value="">All 47 counties</option>
          {COUNTIES.map((c) => (<option key={c.slug} value={c.slug}>{c.county}</option>))}
        </select>
      </div>
      {(shops && shops.length > 0) && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold">Shops matching your search</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Store className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <Link to="/shop/$slug" params={{ slug: s.slug }} className="block truncate font-semibold hover:underline">{s.shop_name}</Link>
                  <p className="truncate text-xs text-muted-foreground">{s.market_name}</p>
                </div>
                <FollowButton vendorId={s.id} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}
      </div>
      {(products || []).length === 0 && <p className="mt-10 text-center text-muted-foreground">No products match yet. Try another word or category.</p>}
    </div>
  );
}`;
files['src/routes/shop.$slug.tsx'] = `import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageCircle, Phone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCounty } from "@/data/markets";
import { FollowButton } from "@/components/follow-button";
import { ProductCard, type ProductRow } from "@/components/product-card";
export const Route = createFileRoute("/shop/$slug")({ component: ShopPage });
function ShopPage() {
  const { slug } = Route.useParams();
  const { data: shop } = useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });
  const { data: products } = useQuery({
    queryKey: ["shop-products", shop ? shop.id : ""],
    enabled: !!shop && shop.status === "active",
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors(shop_name, slug, county_slug, market_name)").eq("vendor_id", shop!.id).order("created_at", { ascending: false });
      return data as ProductRow[];
    },
  });
  if (!shop) return <p className="py-16 text-center text-muted-foreground">Loading shop...</p>;
  const county = getCounty(shop.county_slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Store className="size-7" /></span>
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold">{shop.shop_name} <BadgeCheck className="size-5 text-accent" /></h1>
            <p className="text-sm text-muted-foreground">{shop.market_name} · {county ? county.county : ""} · {shop.followers_count ?? 0} followers</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <FollowButton vendorId={shop.id} />
            {shop.phone && (<a href={"tel:" + shop.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"><Phone className="size-4" /> Call</a>)}
            {shop.whatsapp && (<a href={"https://wa.me/" + shop.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"><MessageCircle className="size-4" /> WhatsApp</a>)}
          </div>
        </div>
      </div>
      {shop.status === "blocked" ? (
        <div className="mt-8 rounded-2xl border-2 border-destructive bg-destructive/10 p-8 text-center">
          <p className="font-display text-xl font-bold text-destructive">This shop is temporarily suspended</p>
          <p className="mt-2 text-sm text-muted-foreground">The trader is settling their subscription. Please check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      )}
    </div>
  );
}`;
for (const [file, content] of Object.entries(files)) {
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: ads + search + enforcement');