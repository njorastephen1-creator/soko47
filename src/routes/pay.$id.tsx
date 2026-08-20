import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, Phone } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/pay/$id")({ component: PayHub });
function PayHub() {
  const { id } = Route.useParams();
  const { data: order } = useQuery({
    queryKey: ["pay-order", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });
  const { data: items } = useQuery({
    queryKey: ["pay-items", id],
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", id);
      return data || [];
    },
  });
  const vendorIds = Array.from(new Set((items || []).map((i: any) => i.vendor_id))) as string[];
  const { data: vendors } = useQuery({
    queryKey: ["pay-vendors", vendorIds.join(",")],
    enabled: vendorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, shop_name, pay_phone, till_number, intasend_publishable, phone").in("id", vendorIds);
      return data || [];
    },
  });
  if (!order || !items) return <p className="py-16 text-center text-muted-foreground">Loading payment hub...</p>;
  const groups = (vendors || []).map((v: any) => {
    const lines = (items || []).filter((i: any) => i.vendor_id === v.id);
    const gtotal = lines.reduce((s: number, i: any) => s + Number(i.unit_price_kes) * i.quantity, 0);
    return { v, lines, total: gtotal };
  });
  const fired = useRef(false);
  useEffect(() => {
    // auto-fired: buyer gets the trader's M-Pesa prompt without tapping anything
    if (fired.current || !groups.length) return;
    const connected = groups.filter((g: any) => g.v.intasend_publishable);
    if (connected.length !== 1) return;
    fired.current = true;
    const g = connected[0];
    toast.info("Connecting you to " + g.v.shop_name + "'s secure M-Pesa...");
    (async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const r = await fetch("https://api.intasend.com/api/v1/payment/checkout-link/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_public_key: g.v.intasend_publishable, amount: String(g.total), currency: "KES", api_ref: id.slice(0, 8) + "-" + g.v.id.slice(0, 4), phone_number: order.buyer_phone, first_name: order.buyer_name, last_name: "", email: "buyer@soko47.co.ke", redirect_url: origin + "/orders", host: origin })
        });
        const d = await r.json().catch(() => ({}));
        const url = d.url || d.checkout_url || d.link;
        if (url) setTimeout(() => { window.location.href = url; }, 1200);
      } catch { }
    })();
  }, [groups.length]);
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(label + " copied - pay via M-Pesa app");
  };
  const prompt = async (g: any) => {
    try {
      const r = await fetch("https://api.intasend.com/api/v1/payment/checkout-link/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_public_key: g.v.intasend_publishable, amount: String(g.total), currency: "KES", api_ref: id.slice(0, 8) + "-" + g.v.id.slice(0, 4), phone_number: order.buyer_phone, first_name: order.buyer_name, last_name: "", email: "buyer@soko47.co.ke" })
      });
      const d = await r.json().catch(() => ({}));
      const url = d.url || d.checkout_url || d.link || (d.invoice && d.invoice.url);
      if (!r.ok || !url) { toast.error(d.error || "Trader payment link unavailable - use M-Pesa number below"); return; }
      window.open(url, "_blank");
      toast.success("Follow the prompt to pay " + g.v.shop_name + " " + formatKes(g.total));
    } catch {
      toast.error("Network error - use the M-Pesa number below");
    }
  };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="font-display text-3xl font-bold">Pay your traders</h1>
      <p className="mt-1 text-sm text-muted-foreground">Money goes straight to each trader - Soko47 never touches it. Order for {order.buyer_name} · {order.buyer_phone}</p>
      <div className="mt-6 space-y-4">
        {groups.map((g: any) => (
          <div key={g.v.id} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">{g.v.shop_name}</h2>
              <p className="font-display text-xl font-extrabold text-accent-deep">{formatKes(g.total)}</p>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {g.lines.map((i: any, x: number) => (<p key={x}>{i.title} × {i.quantity} · {formatKes(Number(i.unit_price_kes) * i.quantity)}</p>))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {g.v.intasend_publishable ? <Button size="sm" onClick={() => prompt(g)}><ExternalLink className="size-4" /> Auto-prompt my phone</Button> : null}
              {g.v.pay_phone ? <Button size="sm" variant="outline" onClick={() => copy(g.v.pay_phone, "M-Pesa " + g.v.pay_phone)}><Copy className="size-4" /> M-Pesa: {g.v.pay_phone}</Button> : null}
              {g.v.till_number ? <Button size="sm" variant="outline" onClick={() => copy(g.v.till_number, "Till " + g.v.till_number)}><Copy className="size-4" /> Till: {g.v.till_number}</Button> : null}
              {g.v.phone ? <a href={"tel:" + g.v.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"><Phone className="size-3.5" /> Call</a> : null}
            </div>
            {!g.v.intasend_publishable && !g.v.pay_phone ? <p className="mt-2 text-xs text-muted-foreground">This trader has not added payment details yet - they will contact you.</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline" className="flex-1"><Link to="/orders">My orders</Link></Button>
        <Button asChild className="flex-1"><Link to="/browse">Continue shopping</Link></Button>
      </div>
    </div>
  );
}
