import fs from 'fs';

// Detect ProductCard's prop name to be safe
const pc = fs.readFileSync('src/components/product-card.tsx', 'utf8');
const m = pc.match(/ProductCard\s*\(\s*\{\s*([a-zA-Z]+)/);
const prop = m ? m[1] : 'product';
console.log('ProductCard prop name:', prop);

const content = `import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { ProductCard } from "@/components/product-card";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/browse")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: (s.q as string) || undefined,
    category: (s.category as string) || undefined,
    sub: (s.sub as string) || undefined,
    county: (s.county as string) || undefined
  }),
  component: BrowsePage
});

const PAGE_SIZE = 60;
const chip = (on: boolean) => "rounded-full border px-4 py-1.5 text-sm " + (on ? "border-accent bg-accent font-semibold text-foreground" : "border-border bg-card");
const subChip = (on: boolean) => "rounded-full border px-3 py-1 text-xs font-medium " + (on ? "border-accent bg-accent font-semibold text-foreground" : "border-accent/50 bg-card text-accent-deep hover:bg-accent/20");

function BrowsePage() {
  const { q, category, sub, county } = Route.useSearch();
  const navigate = useNavigate();
  const nav = (s: any) => navigate({ to: "/browse", search: s });
  const activeCat = CATEGORIES.find((c) => c.slug === category);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [q, category, sub, county]);

  const { data: products, isLoading, isFetching } = useQuery({
    queryKey: ["browse", q, category, sub, county, page],
    queryFn: async () => {
      let query = supabase.from("products")
        .select("*, vendors!inner(shop_name, slug, county_slug, market_name, status, rating_sum, rating_count)")
        .eq("vendors.status", "active")
        .order("created_at", { ascending: false })
        .limit(page * PAGE_SIZE);
      if (q) query = query.or("title.ilike.%" + q + "%,description.ilike.%" + q + "%");
      if (category) query = query.eq("category_slug", category);
      if (sub) query = query.eq("subcategory", sub);
      if (county) query = query.eq("vendors.county_slug", county);
      const { data, error } = await query;
      if (error) { console.error(error); return []; }
      return data || [];
    },
  });

  const hasMore = !!products && products.length === page * PAGE_SIZE;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 md:pb-8">
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
        {(products || []).map((p) => (
          <ProductCard key={p.id} ${prop}={p} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            className="rounded-full border border-accent bg-accent px-8 py-3 font-semibold text-foreground hover:bg-accent-deep disabled:opacity-50"
          >
            {isFetching ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
      {!isLoading && (products || []).length === 0 && <p className="py-16 text-center text-muted-foreground">No products match yet. Try another word or category.</p>}
    </div>
  );
}
`;

fs.writeFileSync('src/routes/browse.tsx', content);
console.log('browse.tsx fixed (v5-safe, no onSuccess)');