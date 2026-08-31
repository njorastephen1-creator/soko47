import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {ReceiptText, Trash2, MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const { data: reviewedSet } = useQuery({
    queryKey: ["reviewed-vendors", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("vendor_id").eq("user_id", session!.user.id);
      return new Set((data || []).map((r: any) => r.vendor_id));
    },
  });
  const [rateFor, setRateFor] = useState<string | null>(null);
  const [rateStars, setRateStars] = useState(5);
  const [rateComment, setRateComment] = useState("");
  const submitReview = async (vendorId: string) => {
    const { error } = await supabase.from("reviews").insert({ vendor_id: vendorId, user_id: session!.user.id, rating: rateStars, comment: rateComment.trim() || null, reviewer_name: (session!.user_metadata?.full_name as string) || (session!.user.email || "buyer").split("@")[0] });
    if (error) return toast.error(error.message.includes("duplicate") ? "You already reviewed this shop - asante!" : error.message);
    setRateFor(null);
    setRateComment("");
    setRateStars(5);
    qc.invalidateQueries();
    toast.success("Review published - asante!");
  };n  const remove = async (id: string) => {
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order removed");
  };
  if (!orders) return <p className="py-16 text-center text-muted-foreground">Loading your orders...</p>;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:pb-8">
      <div className="flex items-center justify-between gap-2"><h1 className="font-display text-3xl font-bold">My orders</h1><Button asChild size="sm" variant="outline"><Link to="/profile">👤 My profile</Link></Button></div>
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
              {o.delivery_status && o.delivery_status !== "none" ? <p className="mt-1 text-xs font-semibold text-accent-deep">Delivery: {o.delivery_status}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {lines[0] && session ? <Button asChild size="sm" variant="outline"><Link to="/chat/$vendorId/$buyerId" params={{ vendorId: lines[0].vendor_id, buyerId: session.user.id }}><MessageCircle className="size-4" /> Chat</Link></Button> : null}
                <Button asChild size="sm" variant="outline"><Link to="/receipt/$id" params={{ id: o.id }}><ReceiptText className="size-4" /> Receipt</Link></Button>
                {deletable ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(o.id)}><Trash2 className="size-4" /> Delete order</Button> : null}
              </div>
              {o.status === "fulfilled" && lines[0] && reviewedSet && !reviewedSet.has(lines[0].vendor_id) && (
                <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
                  {rateFor !== o.id ? (
                    <button onClick={() => setRateFor(o.id)} className="flex w-full items-center justify-between text-sm font-semibold">
                      <span>Rate this trader</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={"size-4 " + (i <= 5 ? "fill-warning text-warning" : "text-muted-foreground/30")} />)}</div>
                    </button>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold">How was your order?</p>
                      <div className="mt-2 flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <button key={i} onClick={() => setRateStars(i)} aria-label={i + " stars"}>
                            <Star className={"size-6 " + (i <= rateStars ? "fill-warning text-warning" : "text-muted-foreground/40")} />
                          </button>
                        ))}
                      </div>
                      <Textarea className="mt-3" rows={2} value={rateComment} onChange={(e) => setRateComment(e.target.value)} placeholder="How was the service? The produce?" />
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => submitReview(lines[0].vendor_id)}>Publish review</Button>
                        <Button size="sm" variant="outline" onClick={() => setRateFor(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
