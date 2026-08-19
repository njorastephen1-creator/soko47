import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3">
          <button onClick={() => setSearch({ sub: undefined })} className={"rounded-full border px-3 py-1 text-xs " + (!sub ? "border-accent bg-accent font-semibold text-foreground" : "border-accent/50 bg-card text-accent-deep hover:bg-accent/20")}>All {activeCat.name}</button>
          {activeCat.subs.map((s) => (
            <button key={s} onClick={() => setSearch({ sub: s })} className={"rounded-full border px-3 py-1 text-xs " + (sub === s ? "border-accent bg-accent font-semibold text-foreground" : "border-accent/50 bg-card text-accent-deep hover:bg-accent/20")}>{s}</button>
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
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}
      </div>
      {(products || []).length === 0 && <p className="mt-10 text-center text-muted-foreground">No products match yet. Try another word or category.</p>}
    </div>
  );
}