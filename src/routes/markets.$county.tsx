import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store, UtensilsCrossed, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCounty } from "@/data/markets";
import { ProductCard, type ProductRow } from "@/components/product-card";
export const Route = createFileRoute("/markets/$county")({
  loader: ({ params }) => {
    const county = getCounty(params.county);
    if (!county) throw notFound();
    return county;
  },
  component: CountyPage
});
function CountyPage() {
  const county = Route.useLoaderData();
  const { data: shops } = useQuery({
    queryKey: ["county-shops", county.slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("id, shop_name, slug, market_name, description").eq("county_slug", county.slug);
      if (error) throw error;
      return data || [];
    },
  });
  const { data: products } = useQuery({
    queryKey: ["county-products", county.slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, vendors!inner(shop_name, slug, county_slug, market_name)").eq("is_active", true).eq("vendors.county_slug", county.slug).limit(12);
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link to="/markets" className="text-sm text-accent-deep">← All counties</Link>
      <h1 className="mt-3 text-3xl font-bold md:text-4xl">{county.county} County markets</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: Store, label: "Largest general market", value: county.general, note: "The main trading floor for the county." },
          { icon: UtensilsCrossed, label: "Wholesale household / mali mali", value: county.maliMali, note: "Plastics, basins, utensils and housewares." },
          { icon: Sprout, label: "Agricultural / fresh produce", value: county.produce, note: county.produceNote }
        ].map((b) => (
          <div key={b.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <b.icon className="size-5 text-accent-deep" />
            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{b.label}</p>
            <p className="mt-1 font-display text-lg font-bold">{b.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{b.note}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-12 text-2xl font-bold">Shops in {county.county}</h2>
      {shops && shops.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s: any) => (
            <Link key={s.id} to="/shop/$slug" params={{ slug: s.slug }} className="rounded-2xl border border-border bg-card p-4 hover:shadow-lift">
              <p className="font-semibold">{s.shop_name}</p>
              <p className="text-sm text-muted-foreground">{s.market_name}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No shops registered here yet. <Link to="/sell" className="text-accent-deep underline">Be the first trader from {county.county}.</Link></p>
      )}
      {products && products.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl font-bold">Goods from {county.county}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </>
      )}
    </div>
  );
}