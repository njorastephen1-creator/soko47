import fs from 'fs';
let r = fs.readFileSync('src/routes/_authenticated/rider.tsx', 'utf8');

// Imports
if (!r.includes('ImageUpload')) {
  r = r.split('import { Label } from "@/components/ui/label";').join('import { Label } from "@/components/ui/label";\nimport { ImageUpload } from "@/components/image-upload";\nimport { stkPush, stkStatus } from "@/lib/mpesa";');
}
// State: add images + payment
if (!r.includes('idImage')) {
  r = r.split('const [form, setForm] = useState({ name: "", phone: "", area: "", idNumber: "", vehicleType: "Boda boda", vehicleReg: "", emName: "", emPhone: "" });').join('const [form, setForm] = useState({ name: "", phone: "", area: "", idNumber: "", vehicleType: "Boda boda", vehicleReg: "", emName: "", emPhone: "", idImage: "", vehregImage: "", selfie: "" });\n  const [payPhone, setPayPhone] = useState("");\n  const [paying, setPaying] = useState(false);\n  const [payMsg, setPayMsg] = useState("");');
}
// Upload fields
if (!r.includes('Upload ID document')) {
  r = r.split('        <div><Label>National ID number</Label><Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="e.g. 12345678" /></div>').join('        <div><Label>National ID number</Label><Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="e.g. 12345678" /></div>\n        <div><Label>Upload ID document (photo)</Label><ImageUpload value={form.idImage} onChange={(u) => setForm({ ...form, idImage: u })} /></div>');
  r = r.split('        <div><Label>Vehicle reg (optional)</Label><Input value={form.vehicleReg} onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })} placeholder="e.g. KABC 123D" /></div>').join('        <div><Label>Vehicle reg (optional)</Label><Input value={form.vehicleReg} onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })} placeholder="e.g. KABC 123D" /></div>\n        <div><Label>Upload vehicle reg (photo)</Label><ImageUpload value={form.vehregImage} onChange={(u) => setForm({ ...form, vehregImage: u })} /></div>');
  r = r.split('        <p className="text-xs text-muted-foreground">These details protect buyers and let Soko47 trace every delivery.</p>').join('        <div><Label>Upload a selfie (for verification)</Label><ImageUpload value={form.selfie} onChange={(u) => setForm({ ...form, selfie: u })} /></div>\n        <p className="text-xs text-muted-foreground">These details protect buyers and let Soko47 trace every delivery.</p>');
}
// Validation with images
if (!r.includes('ID photo, selfie')) {
  r = r.split('if (form.name.trim().length < 2 || form.phone.trim().length < 10 || form.idNumber.trim().length < 6 || form.emPhone.trim().length < 10) return toast.error("Name, phone, ID number and emergency phone are required");').join('if (form.name.trim().length < 2 || form.phone.trim().length < 10 || form.idNumber.trim().length < 6 || form.emPhone.trim().length < 10 || !form.idImage || !form.selfie || (form.vehicleType !== "On foot" && !form.vehregImage)) return toast.error("ID photo, selfie and vehicle reg photo are required");');
}
// Insert with images
if (!r.includes('id_image: form.idImage')) {
  r = r.split('emergency_phone: form.emPhone.trim(), status: "available" }).').join('emergency_phone: form.emPhone.trim(), id_image: form.idImage, vehreg_image: form.vehregImage || null, selfie_image: form.selfie, status: "available" }).');
}
// Subscription helpers + gating
if (!r.includes('payRiderSub')) {
  r = r.split('  const online = rider.status !== "offline";').join(`  const subActive = !!(rider.subscription_expires_at && new Date(rider.subscription_expires_at).getTime() > Date.now());
  const payRiderSub = async () => {
    if (!payPhone.trim()) return toast.error("Enter your M-Pesa number");
    setPaying(true);
    setPayMsg("Sending STK prompt - check your phone...");
    try {
      const d = await stkPush(payPhone.trim(), 300, "RIDER-" + rider.id.slice(0, 8), rider.name);
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
  const online = rider.status !== "offline";`);
}
// Gate accept on subscription
if (!r.includes('Activate your rider subscription')) {
  r = r.split('  const accept = async (o: any) => {\n    const { error } = await supabase.from("orders").update(').join('  const accept = async (o: any) => {\n    if (!subActive) return toast.error("Activate your rider subscription first");\n    const { error } = await supabase.from("orders").update(');
  r = r.split('<Button size="sm" disabled={!online} onClick={() => accept(o)}>Accept delivery</Button>').join('<Button size="sm" disabled={!online || !subActive} onClick={() => accept(o)}>Accept delivery</Button>');
}
// Subscription card
if (!r.includes('Rider subscription - M-Pesa')) {
  r = r.split('      {!online ? <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm font-semibold">You are offline - go online to receive delivery requests.</div> : null}').join(`      {!subActive ? (
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
      {!online ? <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm font-semibold">You are offline - go online to receive delivery requests.</div> : null}`);
}
fs.writeFileSync('src/routes/_authenticated/rider.tsx', r);
console.log('Rider: image uploads + subscription payment');

// Admin riders: docs links
let a = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
if (a.includes('<th className={td}>Emergency</th>') && !a.includes('Docs')) {
  a = a.split('<th className={td}>Emergency</th><th className={td}>Area</th>').join('<th className={td}>Emergency</th><th className={td}>Docs</th><th className={td}>Area</th>');
  a = a.split('                    <td className={td + " text-xs"}>{r.emergency_name || "-"} {r.emergency_phone ? "· " + r.emergency_phone : ""}</td>\n                    <td className={td}>{r.area}</td>').join('                    <td className={td + " text-xs"}>{r.emergency_name || "-"} {r.emergency_phone ? "· " + r.emergency_phone : ""}</td>\n                    <td className={td}><div className="flex gap-1">{r.id_image ? <a className="text-xs underline" href={r.id_image} target="_blank" rel="noreferrer">ID</a> : null}{r.vehreg_image ? <a className="text-xs underline" href={r.vehreg_image} target="_blank" rel="noreferrer">Reg</a> : null}{r.selfie_image ? <a className="text-xs underline" href={r.selfie_image} target="_blank" rel="noreferrer">Selfie</a> : null}</div></td>\n                    <td className={td}>{r.area}</td>');
  fs.writeFileSync('src/routes/_authenticated/admin.tsx', a);
  console.log('Admin: rider docs links');
}
console.log('DONE');