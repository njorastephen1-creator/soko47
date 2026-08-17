import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { ProductCard, type ProductRow } from "@/components/product-card";
import { Input } from "@/components/ui/input";
export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
    county: typeof search.county === "string" ? search.county : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    sub: typeof search.sub === "string" ? search.sub : undefined
  }),
  component: Browse
});
function Browse() {
  const { category, county, q, sub } = Route.useSearch();
  const activeCat = CATEGORIES.find((c) => c.slug === category);
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q ?? "");
  const { data: products, isLoading } = useQuery({
    queryKey: ["browse", category, county, q, sub],
    queryFn: async () => {
      let query = supabase.from("products")
        .select("*, vendors!inner(shop_name, slug, county_slug, market_name)")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(60);
      if (category) query = query.eq("category_slug", category);
      if (sub) query = query.eq("subcategory", sub);
      if (county) query = query.eq("vendors.county_slug", county);
      if (q) query = query.ilike("title", "%" + q + "%");
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });
  const setSearch = (next: any) => navigate({ search: (prev: any) => ({ ...prev, ...next }), replace: true });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold md:text-4xl">Browse goods</h1>
      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); setSearch({ q: term || undefined }); }}>
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search sufurias, sofas, tomatoes, phones..." maxLength={80} />
        <button type="submit" className="rounded-md bg-primary px-4 text-primary-foreground"><Search className="size-4" /></button>
      </form>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setSearch({ category: undefined })} className={"rounded-full border px-3 py-1.5 text-sm " + (!category ? "bg-primary text-primary-foreground" : "border-border bg-card")}>All categories</button>
        {CATEGORIES.map((c) => (
          <button key={c.slug} onClick={() => setSearch({ category: c.slug })} className={"flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm " + (category === c.slug ? "bg-primary text-primary-foreground" : "border-border bg-card")}>
            <c.icon className="size-3.5" /> {c.name}
          </button>
        ))}
      </div>
      {activeCat && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setSearch({ sub: undefined })} className={"rounded-full border px-3 py-1 text-xs " + (!sub ? "bg-secondary text-foreground" : "border-border bg-card")}>All {activeCat.name}</button>
          {activeCat.subs.map((s) => (
            <button key={s} onClick={() => setSearch({ sub: s })} className={"rounded-full border px-3 py-1 text-xs " + (sub === s ? "bg-secondary text-foreground" : "border-border bg-card")}>{s}</button>
          ))}
        </div>
      )}
      <div className="mt-4">
        <select value={county ?? ""} onChange={(e) => setSearch({ county: e.target.value || undefined })} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          <option value="">All 47 counties</option>
          {COUNTIES.map((c) => (<option key={c.slug} value={c.slug}>{c.county}</option>))}
        </select>
      </div>
      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading goods...</p>
      ) : products && products.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">Nothing matches that yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Traders are joining daily — <Link to="/sell" className="text-accent-deep underline">list your own goods here</Link>.</p>
        </div>
      )}
    </div>
  );
}