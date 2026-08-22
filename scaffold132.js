import fs from 'fs';
fs.writeFileSync('src/routes/_authenticated/rider.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, CheckCircle2, Package, Phone, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { formatKes } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/_authenticated/rider")({ component: RiderPage });
function RiderPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", area: "" });
  const [hPage, setHPage] = useState(0);
  const { data: rider } = useQuery({
    queryKey: ["my-rider", session ? session.user.id : "anon"],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("riders").select("*").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const { data: open } = useQuery({
    queryKey: ["rider-open"],
    enabled: !!rider,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("delivery_status", "requested").order("created_at", { ascending: false });
      return data || [];
    },
  });
  const { data: mine } = useQuery({
    queryKey: ["rider-mine", rider ? rider.id : "none"],
    enabled: !!rider,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("rider_id", rider!.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  if (!session) return null;
  if (!rider) return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Bike className="size-10 text-accent" />
      <h1 className="mt-2 font-display text-2xl font-bold">Ride & earn with Soko47</h1>
      <p className="mt-1 text-sm text-muted-foreground">Deliver orders, earn KSh 135 per drop (platform keeps KSh 15). Paid straight to your M-Pesa.</p>
      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XX..." /></div>
        <div><Label>Area / town</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Nakuru town" /></div>
        <Button className="w-full" onClick={async () => {
          if (form.name.trim().length < 2 || form.phone.trim().length < 10) return toast.error("Fill name and valid phone");
          const { error } = await supabase.from("riders").insert({ user_id: session.user.id, name: form.name.trim(), phone: form.phone.trim(), area: form.area.trim() || null, status: "available" });
          if (error) return toast.error(error.message);
          qc.invalidateQueries();
          toast.success("Karibu rider! You are live.");
        }}>Become a rider</Button>
      </div>
    </div>
  );
  const online = rider.status !== "offline";
  const setStatus = async (s: string) => {
    const { error } = await supabase.from("riders").update({ status: s }).eq("id", rider.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(s === "offline" ? "You are offline - no new requests" : "You are live - requests coming!");
  };
  const accept = async (o: any) => {
    const { error } = await supabase.from("orders").update({ rider_id: rider.id, delivery_status: "accepted", rider_name: rider.name, rider_phone: rider.phone }).eq("id", o.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order accepted - call the buyer and go!");
  };
  const delivered = async (o: any) => {
    const { error } = await supabase.from("orders").update({ delivery_status: "delivered", status: "fulfilled" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Delivered! KSh 135 earned.");
  };
  const active = (mine || []).filter((o: any) => o.delivery_status === "accepted");
  const done = (mine || []).filter((o: any) => o.delivery_status === "delivered");
  const earnings = done.length * 135;
  const hPages = Math.max(0, Math.ceil(done.length / 15) - 1);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Bike className="size-7 text-accent" /> Rider dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rider.name} · {rider.area}</p>
        </div>
        {online ? <Button variant="outline" onClick={() => setStatus("offline")}>Go offline</Button> : <Button onClick={() => setStatus("available")}>Go online</Button>}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-secondary p-3"><Wallet className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{formatKes(earnings)}</p><p className="text-xs text-muted-foreground">Earned (KSh 135/drop)</p></div>
        <div className="rounded-2xl bg-secondary p-3"><CheckCircle2 className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{done.length}</p><p className="text-xs text-muted-foreground">Delivered</p></div>
        <div className="rounded-2xl bg-secondary p-3"><Package className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{active.length}</p><p className="text-xs text-muted-foreground">Active now</p></div>
        <div className="rounded-2xl bg-secondary p-3"><Bike className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold capitalize">{rider.status}</p><p className="text-xs text-muted-foreground">Status</p></div>
      </div>
      {!online ? <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm font-semibold">You are offline - go online to receive delivery requests.</div> : null}
      <h2 className="mt-6 font-semibold">Open deliveries (KSh 150 fee)</h2>
      <div className="mt-2 space-y-2">
        {(open || []).length === 0 && <p className="text-sm text-muted-foreground">No open requests right now.</p>}
        {(open || []).map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{o.buyer_name} · <a className="underline" href={"tel:" + o.buyer_phone}>{o.buyer_phone}</a></p>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent-deep">{formatKes(135)} for you</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" disabled={!online} onClick={() => accept(o)}>Accept delivery</Button>
              <Button size="sm" variant="outline" asChild={false} onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call</Button>
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-semibold">Active deliveries</h2>
      <div className="mt-2 space-y-2">
        {active.length === 0 && <p className="text-sm text-muted-foreground">Nothing in motion - accept an open delivery.</p>}
        {active.map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <p className="text-sm font-semibold">{o.buyer_name} · <a className="underline" href={"tel:" + o.buyer_phone}>{o.buyer_phone}</a></p>
            <p className="mt-1 text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => delivered(o)}>Mark delivered</Button>
              <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call</Button>
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-semibold">Delivery history</h2>
      <div className="mt-2 space-y-2">
        {done.slice(hPage * 15, hPage * 15 + 15).map((o: any) => (
          <div key={o.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
            <span>{new Date(o.created_at).toLocaleDateString()} · {o.buyer_name} · {o.delivery_location}</span>
            <span className="font-semibold text-success">+{formatKes(135)}</span>
          </div>
        ))}
        {done.length === 0 && <p className="text-sm text-muted-foreground">No completed deliveries yet.</p>}
      </div>
      {hPages > 0 ? (
        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
          <button disabled={hPage === 0} onClick={() => setHPage(hPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
          <span>Page {hPage + 1} of {hPages + 1}</span>
          <button disabled={hPage >= hPages} onClick={() => setHPage(hPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      ) : null}
    </div>
  );
}
`);
console.log('DONE: professional rider dashboard');