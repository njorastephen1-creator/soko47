import { Link } from "@tanstack/react-router";
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
