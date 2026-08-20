import fs from 'fs';
fs.writeFileSync('src/routes/browse.tsx', `import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { ProductCard } from "@/components/product-card";
export const Route = createFileRoute("/browse")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: (s.q as string) || undefined,
    category: (s.category as string) || undefined,
    sub: (s.sub as string) || undefined,
    county: (s.county as string) || undefined
  }),
  component: BrowsePage
});
const chip = (on: boolean) => "rounded-full border px-4 py-1.5 text-sm " + (on ? "border-accent bg-accent font-semibold text-foreground" : "border-border bg-card");
const subChip = (on: boolean) => "rounded-full border px-3 py-1 text-xs font-medium " + (on ? "border-accent bg-accent font-semibold text-foreground" : "border-accent/50 bg-card text-accent-deep hover:bg-accent/20");
function BrowsePage() {
  const { q, category, sub, county } = Route.useSearch();
  const navigate = useNavigate();
  const nav = (s: any) => navigate({ to: "/browse", search: s });
  const activeCat = CATEGORIES.find((c) => c.slug === category);
  const { data: products, isLoading } = useQuery({
    queryKey: ["browse", q, category, sub, county],
    queryFn: async () => {
      let query = supabase.from("products")
        .select("*, vendors!inner(shop_name, slug, county_slug, market_name, status, rating_sum, rating_count)")
        .eq("vendors.status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      if (q) query = query.or("title.ilike.%" + q + "%,description.ilike.%" + q + "%");
      if (category) query = query.eq("category_slug", category);
      if (sub) query = query.eq("subcategory", sub);
      if (county) query = query.eq("vendors.county_slug", county);
      const { data, error } = await query;
      if (error) { console.error(error); return []; }
      return data || [];
    },
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">{q ? "Results for " + q : "Shop all goods"}</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => nav({ q, county })} className={chip(!category)}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c.slug} onClick={() => nav({ q, category: c.slug, county })} className={chip(category === c.slug)}>{c.name}</button>
        ))}
      </div>
      {activeCat && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3">
          <button onClick={() => nav({ q, category, county })} className={subChip(!sub)}>All {activeCat.name}</button>
          {activeCat.subs.map((s) => (
            <button key={s} onClick={() => nav({ q, category, sub: s, county })} className={subChip(sub === s)}>{s}</button>
          ))}
        </div>
      )}
      <select value={county || ""} onChange={(e) => nav({ q, category, sub, county: e.target.value || undefined })} className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm">
        <option value="">All 47 counties</option>
        {COUNTIES.map((c) => (<option key={c.slug} value={c.slug}>{c.county}</option>))}
      </select>
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {(products || []).map((p: any) => (<ProductCard key={p.id} product={p} />))}
      </div>
      {!isLoading && (products || []).length === 0 && <p className="py-16 text-center text-muted-foreground">No products match yet. Try another word or category.</p>}
    </div>
  );
}
`);
console.log('Created bulletproof browse search');
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
const oldLogo = '<Link to="/" className="flex shrink-0 items-center rounded-lg bg-white p-2" aria-label="Soko47 home">';
const newLogo = '<Link to="/" className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 shadow-md" aria-label="Soko47 home">';
if (chrome.includes(oldLogo)) {
  chrome = chrome.split(oldLogo).join(newLogo);
  chrome = chrome.split('<span className="font-display text-sm font-extrabold text-primary">SOKO<span className="text-accent-deep">47</span></span>').join('<ShoppingBasket className="size-4 text-accent-deep" />\n            <span className="font-display text-base font-black tracking-tight text-primary">soko<span className="text-accent-deep">47</span></span>');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Patched logo');
} else console.log('WARNING: logo anchor not found');
console.log('DONE: search + logo');