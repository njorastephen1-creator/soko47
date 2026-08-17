import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { ClipboardList, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/orders")({ component: Orders });
function Orders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(id, title, quantity, unit_price_kes)").order("created_at", { ascending: false });
      return data || [];
    },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold"><ClipboardList className="size-7" />My orders</h1>
      {isLoading ? <p className="mt-6 text-muted-foreground">Loading...</p> : orders && orders.length > 0 ? (
        <div className="mt-6 space-y-4">{orders.map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">Order #{o.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-KE")} · {o.delivery_location}</p>
              </div>
              <span className="warm-surface rounded-full px-3 py-1 text-xs font-medium capitalize">{o.status}</span>
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              {o.order_items.map((i: any) => (
                <li key={i.id} className="flex justify-between"><span>{i.title} × {i.quantity}</span><span>{formatKes(Number(i.unit_price_kes) * i.quantity)}</span></li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-right font-semibold">{formatKes(Number(o.total_kes))}</p>
            <p className="mt-2 text-right"><Link to="/receipt/$id" params={{ id: o.id }} className="text-xs font-medium text-accent-deep underline">View receipt</Link></p>
          </div>
        ))}</div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
          <Package className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">No orders yet.</p>
          <Button asChild className="mt-4"><Link to="/browse">Start shopping</Link></Button>
        </div>
      )}
    </div>
  );
}