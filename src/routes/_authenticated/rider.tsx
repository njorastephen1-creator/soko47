import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Phone } from "lucide-react";
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
          const { error } = await supabase.from("riders").insert({ user_id: session.user.id, name: form.name.trim(), phone: form.phone.trim(), area: form.area.trim() || null });
          if (error) return toast.error(error.message);
          qc.invalidateQueries();
          toast.success("Karibu rider! You are live.");
        }}>Become a rider</Button>
      </div>
    </div>
  );
  const accept = async (o: any) => {
    const { error } = await supabase.from("orders").update({ rider_id: rider.id, delivery_status: "accepted" }).eq("id", o.id);
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
  const doneCount = (mine || []).filter((o: any) => o.delivery_status === "delivered").length;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:pb-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Bike className="size-7 text-accent" /> Rider dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rider.name} · {rider.area} · Earned so far: {formatKes(doneCount * 135)}</p>
      <h2 className="mt-6 font-semibold">Open deliveries (KSh 150 fee)</h2>
      <div className="mt-2 space-y-2">
        {(open || []).length === 0 && <p className="text-sm text-muted-foreground">No open requests right now.</p>}
        {(open || []).map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{o.buyer_name} · <a className="underline" href={"tel:" + o.buyer_phone}>{o.buyer_phone}</a></p>
            <p className="text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>
            <Button size="sm" className="mt-2" onClick={() => accept(o)}>Accept delivery</Button>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-semibold">My deliveries</h2>
      <div className="mt-2 space-y-2">
        {(mine || []).map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between text-xs text-muted-foreground"><span>{new Date(o.created_at).toLocaleString()}</span><span className="font-semibold">{o.delivery_status}</span></div>
            <p className="mt-1 text-sm font-semibold">{o.buyer_name} · {o.delivery_location}</p>
            {o.delivery_status === "accepted" ? <Button size="sm" className="mt-2" onClick={() => delivered(o)}>Mark delivered</Button> : null}
          </div>
        ))}
        {(mine || []).length === 0 && <p className="text-sm text-muted-foreground">Accept your first delivery above.</p>}
      </div>
    </div>
  );
}
