import fs from 'fs';

// Settings hook
fs.writeFileSync('src/lib/use-settings.ts', `import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const DEFAULT_SETTINGS: any = { starter_price: 499, pro_price: 999, rider_sub_price: 300, social_price: 100, boost_price: 50, rider_fee_base: 100, rider_fee_per_km: 50, rider_share_pct: 90, starter_products: 100 };
export function useSettings() {
  const { data } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("settings").eq("id", 1).maybeSingle();
      return data ? { ...DEFAULT_SETTINGS, ...(data.settings || {}) } : DEFAULT_SETTINGS;
    },
  });
  return data || DEFAULT_SETTINGS;
}
`);

// geo: configurable fare
fs.writeFileSync('src/lib/geo.ts', `export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export function feeForKm(km: number, base = 100, perKm = 50) { return Math.round(base + km * perKm); }
export function etaMin(km: number) { return Math.max(5, Math.round((km / 20) * 60)); }
`);

// POS: organized picker
let p = fs.readFileSync('src/routes/_authenticated/pos.tsx', 'utf8');
if (!p.includes('posSearch')) {
  p = p.split('select("id, title, price_kes").eq("vendor_id", myVendor!.id)').join('select("id, title, price_kes, category_slug").eq("vendor_id", myVendor!.id)');
  p = p.split('  const [ordPage, setOrdPage] = useState(0);').join('  const [ordPage, setOrdPage] = useState(0);\n  const [posSearch, setPosSearch] = useState("");\n  const [posCat, setPosCat] = useState("all");\n  const [posPage, setPosPage] = useState(0);');
  p = p.split('  const rcSlice = rcFiltered.slice(rcPage * 15, rcPage * 15 + 15);').join(`  const rcSlice = rcFiltered.slice(rcPage * 15, rcPage * 15 + 15);
  const posCats = Array.from(new Set((myProducts || []).map((x: any) => x.category_slug).filter(Boolean))) as string[];
  const posFiltered = (myProducts || []).filter((x: any) => (posCat === "all" ? true : x.category_slug === posCat)).filter((x: any) => (x.title || "").toLowerCase().includes(posSearch.toLowerCase()));
  const posPages = Math.max(0, Math.ceil(posFiltered.length / 20) - 1);
  const posProdSlice = posFiltered.slice(posPage * 20, posPage * 20 + 20);`);
  p = p.split('            <h2 className="font-semibold">Your products - tap to add</h2>\n            <div className="mt-3 flex flex-wrap gap-2">\n              {(myProducts || []).map((p: any) => (\n                <button key={p.id} onClick={() => addLine(p.title, Number(p.price_kes))} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-accent/20">+ {p.title} · {formatKes(Number(p.price_kes))}</button>\n              ))}\n            </div>').join(`            <h2 className="font-semibold">Your products - tap to add</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input className="w-48" placeholder="Search products..." value={posSearch} onChange={(e) => { setPosSearch(e.target.value); setPosPage(0); }} />
              <select value={posCat} onChange={(e) => { setPosCat(e.target.value); setPosPage(0); }} className="rounded-md border border-border bg-card px-2 py-1 text-xs">
                <option value="all">All categories</option>
                {posCats.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {posProdSlice.map((pp: any) => (
                <button key={pp.id} onClick={() => addLine(pp.title, Number(pp.price_kes))} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-accent/20">+ {pp.title} · {formatKes(Number(pp.price_kes))}</button>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold">
              <button disabled={posPage === 0} onClick={() => setPosPage(posPage - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
              <span>{posFiltered.length} products · page {posPage + 1} of {posPages + 1}</span>
              <button disabled={posPage >= posPages} onClick={() => setPosPage(posPage + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
            </div>`);
  fs.writeFileSync('src/routes/_authenticated/pos.tsx', p);
  console.log('POS: organized picker');
}

// Admin: Settings tab
let a = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
if (!a.includes('saveSettings')) {
  a = a.split('import { formatKes } from "@/lib/cart";').join('import { formatKes } from "@/lib/cart";\nimport { useSettings } from "@/lib/use-settings";');
  a = a.split('  const [bTitle, setBTitle] = useState("");').join('  const settings = useSettings();\n  const [setForm, setSetForm] = useState<any>(null);\n  const sForm = setForm || settings;\n  const [bTitle, setBTitle] = useState("");');
  a = a.split('  const broadcast = async () => {').join(`  const saveSettings = async () => {
    const { error } = await supabase.from("platform_settings").update({ settings: sForm }).eq("id", 1);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Platform pricing updated everywhere - no code needed");
  };
  const broadcast = async () => {`);
  a = a.split('const tabs = ["overview", "vendors", "listings", "orders", "receipts", "users", "riders", "map", "social", "chats", "trash", "broadcast"];').join('const tabs = ["overview", "vendors", "listings", "orders", "receipts", "users", "riders", "map", "social", "settings", "chats", "trash", "broadcast"];');
  a = a.split('      {tab === "broadcast" && (').join(`      {tab === "settings" && (
        <div className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold">Platform pricing - edit live</h2>
          <p className="mt-1 text-xs text-muted-foreground">Change any price and save - it updates across the whole app instantly, no code changes.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[["starter_price", "Starter plan (KSh/mo)"], ["pro_price", "Pro plan (KSh/mo)"], ["rider_sub_price", "Rider sub (KSh/mo)"], ["social_price", "Social (KSh/week)"], ["boost_price", "Boost ad (KSh)"], ["rider_fee_base", "Delivery base fare"], ["rider_fee_per_km", "Per-km fare"], ["rider_share_pct", "Rider share %"], ["starter_products", "Starter product cap"]].map((k) => (
              <div key={k[0]}><p className="text-xs font-semibold">{k[1]}</p><Input type="number" value={sForm[k[0]]} onChange={(e) => setSetForm({ ...sForm, [k[0]]: Number(e.target.value) })} /></div>
            ))}
          </div>
          <Button className="mt-4" onClick={saveSettings}>Save pricing</Button>
        </div>
      )}
      {tab === "broadcast" && (`);
  fs.writeFileSync('src/routes/_authenticated/admin.tsx', a);
  console.log('Admin: Settings tab');
}
console.log('DONE');