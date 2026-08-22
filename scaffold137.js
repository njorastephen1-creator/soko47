import fs from 'fs';
let a = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
if (!a.includes('adm-active')) {
  a = a.split('  const { data: trash } = useQuery(').join('  const { data: activeDel } = useQuery({ queryKey: ["adm-active"], enabled: !!isAdm, refetchInterval: 8000, queryFn: async () => { const { data } = await supabase.from("orders").select("*, vendors(shop_name, lat, lng)").in("delivery_status", ["requested", "accepted"]).order("created_at", { ascending: false }); return data || []; } });\n  const { data: trash } = useQuery(');
}
if (!a.includes('"map"')) {
  a = a.split('const tabs = ["overview", "vendors", "listings", "orders", "receipts", "users", "riders", "chats", "trash", "broadcast"];').join('const tabs = ["overview", "vendors", "listings", "orders", "receipts", "users", "riders", "map", "chats", "trash", "broadcast"];');
  a = a.split('import { formatKes } from "@/lib/cart";').join('import { formatKes } from "@/lib/cart";\nimport { LiveMap } from "@/components/live-map";');
}
if (!a.includes('{tab === "map" && (')) {
  a = a.split('      {tab === "broadcast" && (').join(`      {tab === "map" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Live oversight - every online rider (green) and every open/active delivery pickup (teal), refreshed every 8 seconds.</p>
          <LiveMap height="480px" points={[...(riders || []).filter((r: any) => r.lat != null).map((r: any) => ({ lat: Number(r.lat), lng: Number(r.lng), color: "#25D366", label: "Rider: " + r.name })), ...(activeDel || []).filter((o: any) => o.vendors && o.vendors.lat != null).map((o: any) => ({ lat: Number(o.vendors.lat), lng: Number(o.vendors.lng), color: "#0f766e", label: (o.delivery_status === "accepted" ? "ACTIVE: " : "OPEN: ") + o.buyer_name }))]} />
        </div>
      )}
      {tab === "broadcast" && (`);
}
fs.writeFileSync('src/routes/_authenticated/admin.tsx', a);
console.log('DONE: admin live map');