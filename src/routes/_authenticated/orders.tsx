import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReceiptText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/orders")({ component: Orders });
function Orders() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [ordFilter, setOrdFilter] = useState("all");
  const { data: orders } = useQuery({
    queryKey: ["my-orders", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("buyer_id", session!.user.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  const { data: allItems } = useQuery({
    queryKey: ["my-order-items", (orders || []).map((o: any) => o.id).join(",")],
    enabled: !!session && !!orders && orders.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("*").in("order_id", (orders || []).map((o: any) => o.id));
      return data || [];
    },
  });
  const remove = async (id: string) => {
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order removed");
  };
  if (!orders) return <p className="py-16 text-center text-muted-foreground">Loading your orders...</p>;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="font-display text-3xl font-bold">My orders</h1>
      <div className="mt-3 flex flex-wrap gap-2">{["all", "pending", "fulfilled", "cancelled"].map((f) => (<button key={f} onClick={() => setOrdFilter(f)} className={"rounded-full px-3 py-1 text-xs font-semibold capitalize " + (ordFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary")}>{f}</button>))}</div>
      <div className="mt-6 space-y-4">
        {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet - go find something nice.</p>}
        {orders.filter((o: any) => (ordFilter === "all" ? true : o.status === ordFilter)).map((o: any) => {
          const lines = (allItems || []).filter((i: any) => i.order_id === o.id);
          const deletable = o.status === "pending" || o.status === "cancelled";
          return (
            <div key={o.id} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{new Date(o.created_at).toLocaleString()}</span>
                <span className="flex gap-1">
                  <span className={"rounded-full px-2 py-0.5 font-semibold " + (o.status === "fulfilled" ? "bg-success/15 text-success" : o.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-warning/20 text-foreground")}>{o.status}</span>
                  <span className={"rounded-full px-2 py-0.5 font-semibold " + (o.payment_status === "paid" ? "bg-success/15 text-success" : "bg-secondary")}>{o.payment_status}</span>
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {lines.map((i: any, x: number) => (<div key={x} className="flex justify-between"><span>{i.title} × {i.quantity}</span><span>{formatKes(Number(i.unit_price_kes) * i.quantity)}</span></div>))}
              </div>
              <div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>{formatKes(Number(o.total_kes))}</span></div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><Link to="/receipt/$id" params={{ id: o.id }}><ReceiptText className="size-4" /> Receipt</Link></Button>
                {deletable ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(o.id)}><Trash2 className="size-4" /> Delete order</Button> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
