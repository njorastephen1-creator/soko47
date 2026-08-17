import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, ShieldCheck, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, COUNTIES } from "@/data/markets";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductRow } from "@/components/product-card";
export const Route = createFileRoute("/")({ component: Home });
function Home() {
  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products")
        .select("*, vendors(shop_name, slug, county_slug, market_name)")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });
  return (
    <div>
      <section className="hero-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.15fr_1fr] md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <MapPin className="size-3.5" /> 47 counties · 140+ markets
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">Kenya's great markets, <span className="text-accent">now open online.</span></h1>
            <p className="mt-5 max-w-xl text-base opacity-90 md:text-lg">From Kamukunji plastics and Gikomba fashion to Kongowea produce and Mwea pishori rice — buy directly from the traders who run the stalls, wherever you are.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/browse">Start shopping <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" className="warm-surface border-0 hover:opacity-90"><Link to="/sell">Open a trader shop</Link></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "Kamukunji", v: "Mali mali & utensils" },
              { k: "Kongowea", v: "Coastal produce terminal" },
              { k: "Karatina", v: "Fresh food, Mt Kenya" },
              { k: "Eldoret Main", v: "North Rift cereals" }
            ].map((c) => (
              <div key={c.k} className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
                <p className="font-display text-lg font-bold">{c.k}</p>
                <p className="text-sm opacity-85">{c.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Verified stall owners", d: "Every shop lists its county, market and stall." },
            { icon: Truck, t: "Direct from the source", d: "Agree delivery or pick up at the stall — you talk to the trader." },
            { icon: MapPin, t: "All 47 counties", d: "One directory of the biggest market in each county." }
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <f.icon className="size-6 text-accent-deep" />
              <p className="mt-3 font-semibold">{f.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <h2 className="text-2xl font-bold">Shop by category</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to="/browse" search={{ category: c.slug }} className="rounded-2xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <c.icon className="mx-auto size-6 text-accent-deep" />
              <p className="mt-2 text-sm font-medium leading-snug">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Fresh listings</h2>
          <Link to="/browse" className="text-sm font-medium text-accent-deep">View all</Link>
        </div>
        {products && products.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-medium">No goods listed yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first trader on Soko47 — it takes two minutes to open a shop.</p>
            <Button asChild className="mt-4"><Link to="/sell">Open a shop</Link></Button>
          </div>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Markets by county</h2>
          <Link to="/markets" className="text-sm font-medium text-accent-deep">Full directory</Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {COUNTIES.map((c) => (
            <Link key={c.slug} to="/markets/$county" params={{ county: c.slug }} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-secondary">{c.county}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}