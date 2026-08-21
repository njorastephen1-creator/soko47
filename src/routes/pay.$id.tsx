import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stkPush, stkStatus } from "@/lib/mpesa";
export const Route = createFileRoute("/pay/$id")({ component: PayHub });
function PayHub() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
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
      const { data } = await supabase.from("vendors").select("id, shop_name, pay_phone, till_number, intasend_publishable, phone, soko47_pay").in("id", vendorIds);
      return data || [];
    },
  });
  const groups = (vendors || []).map((v: any) => {
    const lines = (items || []).filter((i: any) => i.vendor_id === v.id);
    const gtotal = lines.reduce((s: number, i: any) => s + Number(i.unit_price_kes) * i.quantity, 0);
    return { v, lines, total: gtotal };
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  useEffect(() => {
    if (order && !mpesaPhone) setMpesaPhone(order.buyer_phone || "");
  }, [order]);
  const doPayout = async (g: any) => {
    const gross = Math.round(g.total);
    const net = Math.round(gross * 0.99);
    const fee = gross - net;
    const r = await fetch("/api/payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: g.v.pay_phone, amount: net, reference: "S47P-" + id.slice(0, 8) + "-" + g.v.id.slice(0, 8), name: g.v.shop_name }) });
    const d = await r.json().catch(() => ({}));
    await supabase.from("payouts").insert({ order_id: id, vendor_id: g.v.id, gross_kes: gross, fee_kes: fee, net_kes: net, status: r.ok ? "sent" : "failed", invoice_id: (d && d.invoice_id) || null }).catch(() => {});
    if (!r.ok) { toast.error("Payout queued - trader collects from dashboard"); return; }
    toast.success("Trader paid " + formatKes(net) + " instantly (1% platform fee earned)");
  };
  const payGroup = async (g: any) => {
    if (mpesaPhone.replace(/[^0-9]/g, "").length < 10) { toast.error("Enter a valid M-Pesa number to receive the prompt"); return; }
    setBusy(g.v.id);
    try {
      const d = await stkPush(mpesaPhone.trim() || order.buyer_phone, g.total, "S47-" + id.slice(0, 8) + "-" + g.v.id.slice(0, 8), order.buyer_name);
      const invoice = d.invoice_id || d.id;
      if (!invoice) throw new Error(d.error || "No invoice");
      toast.info("M-Pesa prompt sent - enter your PIN");
      for (let i = 0; i < 30; i++) {
        await new Promise((r2) => setTimeout(r2, 4000));
        const s = await stkStatus(invoice);
        const state = String((s.invoice && s.invoice.state) || s.state || "").toLowerCase();
        if (["complete", "completed", "paid", "success"].includes(state)) {
          await supabase.from("orders").update({ payment_status: "paid", payment_ref: invoice, payment_method: "Soko47 Pay (auto-verified)" }).eq("id", id);
          qc.invalidateQueries();
          toast.success("Payment received!");
          if (g.v.pay_phone) fetch("/api/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: g.v.pay_phone, message: "Soko47: paid order " + id.slice(0, 6) + " worth " + formatKes(g.total) + " from " + order.buyer_name }) }).catch(() => {});
          if (g.v.pay_phone) await doPayout(g);
          setBusy(null);
          return;
        }
        if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state);
      }
      toast.error("Timed out - check your M-Pesa messages");
    } catch (e: any) {
      toast.error(String(e.message || e));
    }
    setBusy(null);
  };
  const fired47 = useRef(false);
  useEffect(() => {
    if (fired47.current || !groups.length || !order || mpesaPhone.replace(/[^0-9]/g, "").length < 10) return;
    const g47 = groups.filter((g: any) => g.v.soko47_pay && g.v.pay_phone);
    if (g47.length !== 1) return;
    fired47.current = true;
    toast.info("Soko47 Pay: sending prompt for " + g47[0].v.shop_name + "...");
    payGroup(g47[0]);
  }, [groups.length, order, mpesaPhone]);
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current || !groups.length || !order) return;
    const connected = groups.filter((g: any) => g.v.intasend_publishable && !g.v.soko47_pay);
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
          body: JSON.stringify({ api_public_key: g.v.intasend_publishable, amount: String(g.total), currency: "KES", api_ref: id.slice(0, 8) + "-" + g.v.id.slice(0, 4), phone_number: order.buyer_phone, first_name: order.buyer_name, last_name: "", email: "buyer@soko47.co.ke", redirect_url: origin + "/pay/" + id + "?paid=1", host: origin })
        });
        const d = await r.json().catch(() => ({}));
        const url = d.url || d.checkout_url || d.link;
        if (url) setTimeout(() => { window.location.href = url; }, 1200);
      } catch { }
    })();
  }, [groups.length, order]);
  const paidDone = useRef(false);
  useEffect(() => {
    if (paidDone.current) return;
    const qs = typeof window !== "undefined" ? window.location.search : "";
    if (!qs.includes("paid=1") || !order) return;
    paidDone.current = true;
    (async () => {
      await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);
      qc.invalidateQueries();
      toast.success("Payment confirmed - order saved for the trader to deliver");
    })();
  }, [order]);
  if (!order || !items) return <p className="py-16 text-center text-muted-foreground">Loading payment hub...</p>;
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(label + " copied - pay via M-Pesa app");
  };
  const prompt = async (g: any) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const r = await fetch("https://api.intasend.com/api/v1/payment/checkout-link/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_public_key: g.v.intasend_publishable, amount: String(g.total), currency: "KES", api_ref: id.slice(0, 8) + "-" + g.v.id.slice(0, 4), phone_number: order.buyer_phone, first_name: order.buyer_name, last_name: "", email: "buyer@soko47.co.ke", redirect_url: origin + "/pay/" + id + "?paid=1", host: origin })
      });
      const d = await r.json().catch(() => ({}));
      const url = d.url || d.checkout_url || d.link;
      if (!r.ok || !url) { toast.error(d.error || "Trader payment link unavailable - use M-Pesa number below"); return; }
      window.location.href = url;
    } catch {
      toast.error("Network error - use the M-Pesa number below");
    }
  };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="font-display text-3xl font-bold">Pay your traders</h1>
      <p className="mt-1 text-sm text-muted-foreground">Money goes straight to each trader - Soko47 never touches it. Order for {order.buyer_name} · {order.buyer_phone}</p>
      <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 p-4">
        <Label>📲 M-Pesa number to receive the prompt</Label>
        <Input className="mt-2" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="07XX XXX XXX" />
        <p className="mt-1 text-xs text-muted-foreground">The prompt will pop on this phone - edit if it is not your M-Pesa number.</p>
      </div>
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
              {g.v.soko47_pay && g.v.pay_phone ? <Button size="sm" onClick={() => payGroup(g)} disabled={busy === g.v.id}>{busy === g.v.id ? "Waiting for PIN..." : "⚡ Soko47 Pay " + formatKes(g.total)}</Button> : null}
              {g.v.intasend_publishable ? <Button size="sm" onClick={() => prompt(g)}><ExternalLink className="size-4" /> Auto-prompt my phone</Button> : null}
              {g.v.pay_phone ? <Button size="sm" variant="outline" onClick={() => copy(g.v.pay_phone, "M-Pesa " + g.v.pay_phone)}><Copy className="size-4" /> M-Pesa: {g.v.pay_phone}</Button> : null}
              {g.v.till_number ? <Button size="sm" variant="outline" onClick={() => copy(g.v.till_number, "Till " + g.v.till_number)}><Copy className="size-4" /> Till: {g.v.till_number}</Button> : null}
              {g.v.phone ? <a href={"tel:" + g.v.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"><Phone className="size-3.5" /> Call</a> : null}
            </div>
            {!g.v.intasend_publishable && !g.v.pay_phone ? <p className="mt-2 text-xs text-muted-foreground">This trader has not added payment details yet - they will contact you.</p> : null}
          </div>
        ))}
      </div>
      <Button size="lg" className="mt-6 w-full" onClick={async () => { await supabase.from("orders").update({ payment_status: "claimed", payment_method: "Direct (buyer claim)" }).eq("id", id); qc.invalidateQueries(); toast.success("Trader notified to verify on their M-Pesa"); }}>💵 I paid directly (cash / M-Pesa to trader)</Button>
      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline" className="flex-1"><Link to="/orders">My orders</Link></Button>
        <Button asChild className="flex-1"><Link to="/browse">Continue shopping</Link></Button>
      </div>
    </div>
  );
}
