import { createFileRoute } from "@tanstack/react-router";
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
import { LiveMap } from "@/components/live-map";
import { haversineKm, feeForKm, etaMin } from "@/lib/geo";
import { ImageUpload } from "@/components/image-upload";
import { stkPush, stkStatus } from "@/lib/mpesa";
export const Route = createFileRoute("/_authenticated/rider")({ component: RiderPage });
function RiderPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", area: "", idNumber: "", vehicleType: "Boda boda", vehicleReg: "", emName: "", emPhone: "", idImage: "", vehregImage: "", selfie: "" });
  const [myPos, setMyPos] = useState<any>(null);
  const [watchId, setWatchId] = useState<any>(null);
  const [payPhone, setPayPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");
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
      const { data } = await supabase.from("orders").select("*, vendors(shop_name, pay_phone, lat, lng)").eq("delivery_status", "requested").order("created_at", { ascending: false });
      return data || [];
    },
  });
  const { data: mine } = useQuery({
    queryKey: ["rider-mine", rider ? rider.id : "none"],
    enabled: !!rider,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, vendors(shop_name, pay_phone, lat, lng)").eq("rider_id", rider!.id).order("created_at", { ascending: false });
      return data || [];
    },
  });
  if (!session) return null;
  if (!rider) return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Bike className="size-10 text-accent" />
      <h1 className="mt-2 font-display text-2xl font-bold">Ride & earn with Soko47</h1>
      <p className="mt-1 text-sm text-muted-foreground">Earn per delivery based on distance - base KSh 100 + KSh 50/km. You keep 90%, the platform keeps 10%. Paid straight to your M-Pesa.</p>
      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XX..." /></div>
        <div><Label>Area / town</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Nakuru town" /></div>
        <div><Label>National ID number</Label><Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="e.g. 12345678" /></div>
        <div><Label>Upload ID document (photo)</Label><ImageUpload value={form.idImage} onChange={(u) => setForm({ ...form, idImage: u })} /></div>
        <div><Label>Vehicle type</Label><select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"><option>Boda boda</option><option>Bicycle</option><option>Tuk-tuk</option><option>On foot</option></select></div>
        <div><Label>Vehicle reg (optional)</Label><Input value={form.vehicleReg} onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })} placeholder="e.g. KABC 123D" /></div>
        <div><Label>Upload vehicle reg (photo)</Label><ImageUpload value={form.vehregImage} onChange={(u) => setForm({ ...form, vehregImage: u })} /></div>
        <div><Label>Emergency contact name</Label><Input value={form.emName} onChange={(e) => setForm({ ...form, emName: e.target.value })} /></div>
        <div><Label>Emergency contact phone</Label><Input value={form.emPhone} onChange={(e) => setForm({ ...form, emPhone: e.target.value })} placeholder="07XX..." /></div>
        <div><Label>Upload a selfie (for verification)</Label><ImageUpload value={form.selfie} onChange={(u) => setForm({ ...form, selfie: u })} /></div>
        <p className="text-xs text-muted-foreground">These details protect buyers and let Soko47 trace every delivery.</p>
        <Button className="w-full" onClick={async () => {
          if (form.name.trim().length < 2 || form.phone.trim().length < 10 || form.idNumber.trim().length < 6 || form.emPhone.trim().length < 10 || !form.idImage || !form.selfie || (form.vehicleType !== "On foot" && !form.vehregImage)) return toast.error("ID photo, selfie and vehicle reg photo are required");
          const { error } = await supabase.from("riders").insert({ user_id: session.user.id, name: form.name.trim(), phone: form.phone.trim(), area: form.area.trim() || null, status: "available" });
          if (error) return toast.error(error.message);
          qc.invalidateQueries();
          toast.success("Karibu rider! You are live.");
        }}>Become a rider</Button>
      </div>
    </div>
  );
  const toggleShare = () => {
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      supabase.from("riders").update({ lat: null, lng: null }).eq("id", rider.id).then(() => qc.invalidateQueries());
      toast.success("Location sharing off");
      return;
    }
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    const id = navigator.geolocation.watchPosition((pos) => {
      setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      supabase.from("riders").update({ lat: pos.coords.latitude, lng: pos.coords.longitude, last_loc_at: new Date().toISOString() }).eq("id", rider.id);
    }, () => toast.error("Allow location access to go live"), { enableHighAccuracy: true, maximumAge: 5000 });
    setWatchId(id);
    toast.success("You are live on the map");
  };
  const subActive = !!(rider.subscription_expires_at && new Date(rider.subscription_expires_at).getTime() > Date.now());
  const payRiderSub = async () => {
    if (!payPhone.trim()) return toast.error("Enter your M-Pesa number");
    setPaying(true);
    setPayMsg("Sending STK prompt - check your phone...");
    try {
      const d = await stkPush(payPhone.trim(), 300, "RIDER-" + rider.id.slice(0, 8), rider.name, rider.pay_phone || undefined);
      const invoice = d.invoice_id || d.id || (d.invoice && d.invoice.invoice_id);
      if (!invoice) throw new Error(d.error || "No invoice");
      setPayMsg("Prompt sent - enter PIN, then wait...");
      for (let i = 0; i < 30; i++) {
        await new Promise((r2) => setTimeout(r2, 4000));
        const s = await stkStatus(invoice);
        const state = String((s.invoice && s.invoice.state) || s.state || s.status || "").toLowerCase();
        if (["complete", "completed", "paid", "success"].includes(state)) {
          await supabase.from("riders").update({ subscription_plan: "active", subscription_expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), pay_phone: payPhone.trim() }).eq("id", rider.id);
          qc.invalidateQueries();
          toast.success("Rider subscription active for 30 days!");
          setPayMsg("PAID - you are active!");
          setPaying(false);
          return;
        }
        if (["failed", "cancelled", "canceled"].includes(state)) throw new Error("Payment " + state);
      }
      setPayMsg("Still pending - check your M-Pesa messages.");
    } catch (e: any) { toast.error(String(e.message || e)); setPayMsg(""); } finally { setPaying(false); }
  };
  const online = rider.status !== "offline";
  const setStatus = async (s: string) => {
    const { error } = await supabase.from("riders").update({ status: s }).eq("id", rider.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(s === "offline" ? "You are offline - no new requests" : "You are live - requests coming!");
  };
  const accept = async (o: any) => {
    if (!subActive) return toast.error("Activate your rider subscription first");
    const { error } = await supabase.from("orders").update({ rider_id: rider.id, delivery_status: "accepted", rider_name: rider.name, rider_phone: rider.phone }).eq("id", o.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Order accepted - call the buyer and go!");
  };
  const delivered = async (o: any) => {
    const { error } = await supabase.from("orders").update({ delivery_status: "delivered", status: "fulfilled" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Delivered! Your 90% fare is on the way to your M-Pesa.");
  };
  const feeFor = (o: any) => {
    if (o.delivery_fee_kes) return Number(o.delivery_fee_kes);
    if (o.pickup_lat != null && o.pickup_lng != null && o.delivery_lat != null && o.delivery_lng != null) return feeForKm(haversineKm(Number(o.pickup_lat), Number(o.pickup_lng), Number(o.delivery_lat), Number(o.delivery_lng)));
    return 150;
  };
  const earnFor = (o: any) => Math.round(feeFor(o) * 0.9);
  const active = (mine || []).filter((o: any) => o.delivery_status === "accepted");
  const done = (mine || []).filter((o: any) => o.delivery_status === "delivered");
  const earnings = done.reduce((s: number, o: any) => s + earnFor(o), 0);
  const hPages = Math.max(0, Math.ceil(done.length / 15) - 1);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8 md:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><Bike className="size-7 text-accent" /> Rider dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rider.name} · {rider.area}</p>
        </div>
        {online ? <Button variant="outline" onClick={() => setStatus("offline")}>Go offline</Button> : <Button onClick={() => setStatus("available")}>Go online</Button>}
        {watchId != null ? <Button variant="outline" onClick={toggleShare}>Stop sharing location</Button> : <Button variant="outline" onClick={toggleShare}>Share live location</Button>}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-secondary p-3"><Wallet className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{formatKes(earnings)}</p><p className="text-xs text-muted-foreground">Earned (90% of fare)</p></div>
        <div className="rounded-2xl bg-secondary p-3"><CheckCircle2 className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{done.length}</p><p className="text-xs text-muted-foreground">Delivered</p></div>
        <div className="rounded-2xl bg-secondary p-3"><Package className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold">{active.length}</p><p className="text-xs text-muted-foreground">Active now</p></div>
        <div className="rounded-2xl bg-secondary p-3"><Bike className="size-4 text-accent-deep" /><p className="mt-1 font-display text-xl font-extrabold capitalize">{rider.status}</p><p className="text-xs text-muted-foreground">Status</p></div>
      </div>
      {!subActive ? (
        <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <h2 className="font-semibold">Rider subscription - M-Pesa</h2>
          <p className="mt-1 text-xs text-muted-foreground">KSh 300/month keeps you active and eligible for deliveries.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input className="w-44" placeholder="M-Pesa phone e.g. 0712..." value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />
            <Button onClick={() => payRiderSub()} disabled={paying}>{paying ? "Waiting..." : "Activate - KSh 300/mo"}</Button>
          </div>
          {payMsg ? <p className="mt-2 text-xs font-semibold">{payMsg}</p> : null}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-success/40 bg-success/10 p-3 text-sm font-semibold text-success">Subscription active until {new Date(rider.subscription_expires_at).toLocaleDateString()}</div>
      )}
      {!online ? <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm font-semibold">You are offline - go online to receive delivery requests.</div> : null}
      <h2 className="mt-6 font-semibold">Open deliveries (fare by distance)</h2>
      <div className="mt-2 space-y-2">
        {(open || []).length === 0 && <p className="text-sm text-muted-foreground">No open requests right now.</p>}
        {(open || []).map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{o.buyer_name} · <a className="underline" href={"tel:" + o.buyer_phone}>{o.buyer_phone}</a></p>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent-deep">{formatKes(135)} for you</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>
            {myPos && o.vendors && o.vendors.lat != null ? (() => { const km = haversineKm(myPos.lat, myPos.lng, Number(o.vendors.lat), Number(o.vendors.lng)); return <p className="mt-1 text-xs font-semibold text-accent-deep">{km.toFixed(1)} km · ~{etaMin(km)} min · fare {formatKes(feeForKm(km))} · you earn {formatKes(Math.round(feeForKm(km) * 0.9))}</p>; })() : null}
            <div className="mt-2 flex gap-2">
              <Button size="sm" disabled={!online || !subActive} onClick={() => accept(o)}>Accept delivery</Button>
              <Button size="sm" variant="outline" asChild={false} onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call</Button>
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-semibold">Live map</h2>
      <div className="mt-2"><LiveMap points={[...(myPos ? [{ lat: myPos.lat, lng: myPos.lng, color: "#25D366", label: "You" }] : []), ...(open || []).filter((o: any) => o.vendors && o.vendors.lat != null).map((o: any) => ({ lat: Number(o.vendors.lat), lng: Number(o.vendors.lng), color: "#0f766e", label: "Pickup: " + (o.vendors.shop_name || "") }))]} /></div>
      <h2 className="mt-6 font-semibold">Active deliveries</h2>
      <div className="mt-2 space-y-2">
        {active.length === 0 && <p className="text-sm text-muted-foreground">Nothing in motion - accept an open delivery.</p>}
        {active.map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <p className="text-sm font-semibold">{o.buyer_name} · <a className="underline" href={"tel:" + o.buyer_phone}>{o.buyer_phone}</a></p>
            <p className="mt-1 text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => delivered(o)}>Mark delivered</Button>
              <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.buyer_phone; }}><Phone className="size-4" /> Call buyer</Button>
              {o.vendors && o.vendors.pay_phone ? <Button size="sm" variant="outline" onClick={() => { window.location.href = "tel:" + o.vendors.pay_phone; }}><Phone className="size-4" /> Call seller</Button> : null}
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-semibold">Delivery history</h2>
      <div className="mt-2 space-y-2">
        {done.slice(hPage * 15, hPage * 15 + 15).map((o: any) => (
          <div key={o.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
            <span>{new Date(o.created_at).toLocaleDateString()} · {o.buyer_name} · {o.delivery_location}</span>
            <span className="font-semibold text-success">+{formatKes(earnFor(o))}</span>
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
