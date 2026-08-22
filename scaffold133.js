import fs from 'fs';
import path from 'path';

// 1) Remove all "Amazon" mentions from the app
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) { if (f !== 'node_modules') walk(p); continue; }
    if (!/\.(tsx?|js)$/.test(f)) continue;
    let c = fs.readFileSync(p, 'utf8');
    const before = c;
    c = c.split('Amazon-depth').join('full');
    c = c.split('Amazon').join('Soko47');
    if (c !== before) { fs.writeFileSync(p, c); console.log('Cleaned brand:', p); }
  }
}
walk('src');

// 2) Rider registration with trackable details
let r = fs.readFileSync('src/routes/_authenticated/rider.tsx', 'utf8');
if (!r.includes('idNumber')) {
  r = r.split('const [form, setForm] = useState({ name: "", phone: "", area: "" });').join('const [form, setForm] = useState({ name: "", phone: "", area: "", idNumber: "", vehicleType: "Boda boda", vehicleReg: "", emName: "", emPhone: "" });');
  r = r.split('        <div><Label>Area / town</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Nakuru town" /></div>').join(`        <div><Label>Area / town</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Nakuru town" /></div>
        <div><Label>National ID number</Label><Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="e.g. 12345678" /></div>
        <div><Label>Vehicle type</Label><select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"><option>Boda boda</option><option>Bicycle</option><option>Tuk-tuk</option><option>On foot</option></select></div>
        <div><Label>Vehicle reg (optional)</Label><Input value={form.vehicleReg} onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })} placeholder="e.g. KABC 123D" /></div>
        <div><Label>Emergency contact name</Label><Input value={form.emName} onChange={(e) => setForm({ ...form, emName: e.target.value })} /></div>
        <div><Label>Emergency contact phone</Label><Input value={form.emPhone} onChange={(e) => setForm({ ...form, emPhone: e.target.value })} placeholder="07XX..." /></div>
        <p className="text-xs text-muted-foreground">These details protect buyers and let Soko47 trace every delivery.</p>`);
  r = r.split('if (form.name.trim().length < 2 || form.phone.trim().length < 10) return toast.error("Fill name and valid phone");').join('if (form.name.trim().length < 2 || form.phone.trim().length < 10 || form.idNumber.trim().length < 6 || form.emPhone.trim().length < 10) return toast.error("Name, phone, ID number and emergency phone are required");');
  r = r.split('area: form.area.trim() || null, status: "available" }).').join('area: form.area.trim() || null, id_number: form.idNumber.trim(), vehicle_type: form.vehicleType, vehicle_reg: form.vehicleReg.trim() || null, emergency_name: form.emName.trim() || null, emergency_phone: form.emPhone.trim(), status: "available" }).');
  fs.writeFileSync('src/routes/_authenticated/rider.tsx', r);
  console.log('Rider: trackable registration');
}

// 3) Admin riders tab shows trackable details
let a = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
if (a.includes('<th className={td}>Area</th><th className={td}>Status</th>') && !a.includes('ID No.')) {
  a = a.split('<thead className={th}><tr><th className={td}>Name</th><th className={td}>Phone</th><th className={td}>Area</th><th className={td}>Status</th><th /></tr></thead>').join('<thead className={th}><tr><th className={td}>Name</th><th className={td}>Phone</th><th className={td}>ID No.</th><th className={td}>Vehicle</th><th className={td}>Emergency</th><th className={td}>Area</th><th className={td}>Status</th><th /></tr></thead>');
  a = a.split('                    <td className={td + " text-muted-foreground"}>{r.phone}</td>\n                    <td className={td}>{r.area}</td>').join('                    <td className={td + " text-muted-foreground"}>{r.phone}</td>\n                    <td className={td}>{r.id_number || "-"}</td>\n                    <td className={td}>{r.vehicle_type || "-"}{r.vehicle_reg ? " · " + r.vehicle_reg : ""}</td>\n                    <td className={td + " text-xs"}>{r.emergency_name || "-"} {r.emergency_phone ? "· " + r.emergency_phone : ""}</td>\n                    <td className={td}>{r.area}</td>');
  fs.writeFileSync('src/routes/_authenticated/admin.tsx', a);
  console.log('Admin: rider traceability columns');
}
console.log('DONE');