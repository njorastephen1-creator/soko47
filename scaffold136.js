import fs from 'fs';
fs.writeFileSync('src/lib/geo.ts', `export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export function feeForKm(km: number) { return Math.round(100 + km * 50); }
export function etaMin(km: number) { return Math.max(5, Math.round((km / 20) * 60)); }
`);
fs.writeFileSync('src/components/live-map.tsx', `import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export function LiveMap({ points, height }: { points: any[]; height?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    mapRef.current = L.map(ref.current).setView([-1.286, 36.817], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);
  }, []);
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();
    const pts: any[] = [];
    (points || []).forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      pts.push([p.lat, p.lng]);
      L.circleMarker([p.lat, p.lng], { radius: 9, color: p.color || "#0f766e", fillColor: p.color || "#0f766e", fillOpacity: 0.85 }).bindPopup(p.label || "").addTo(layerRef.current);
    });
    if (pts.length > 0) mapRef.current.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
  }, [points]);
  return <div ref={ref} style={{ height: height || "320px" }} className="w-full rounded-2xl border border-border" />;
}
`);
console.log('geo + live-map created');

// Vendor: pin stall location
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (!v.includes('setStallLocation')) {
  v = v.split('  const [rails, setRails] = useState<any>(null);').join(`  const setStallLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase.from("vendors").update({ lat: pos.coords.latitude, lng: pos.coords.longitude }).eq("id", vendor.id);
      qc.invalidateQueries();
      toast.success("Stall location pinned - riders now see accurate distance & fee");
    }, () => toast.error("Allow location access"));
  };
  const [rails, setRails] = useState<any>(null);`);
  v = v.split('      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">\n        <h2 className="font-display text-xl font-bold">Subscription - M-Pesa</h2>').join(`      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Delivery pickup point</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pin your stall's GPS so buyers and riders see accurate distance, fare and ETA.</p>
        <Button className="mt-3" onClick={setStallLocation}>{vendor.lat != null ? "Update my stall location" : "Set my stall location"}</Button>
        {vendor.lat != null ? <p className="mt-2 text-xs font-semibold text-success">Stall pinned at {Number(vendor.lat).toFixed(4)}, {Number(vendor.lng).toFixed(4)}</p> : null}
      </div>
      <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="font-display text-xl font-bold">Subscription - M-Pesa</h2>`);
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: stall location');
}

// Rider: live location + nearest-order map with distance/fare/ETA
let r = fs.readFileSync('src/routes/_authenticated/rider.tsx', 'utf8');
if (!r.includes('live-map')) {
  r = r.split('import { Label } from "@/components/ui/label";').join('import { Label } from "@/components/ui/label";\nimport { LiveMap } from "@/components/live-map";\nimport { haversineKm, feeForKm, etaMin } from "@/lib/geo";');
  r = r.split('const [payPhone, setPayPhone] = useState("");').join('const [myPos, setMyPos] = useState<any>(null);\n  const [watchId, setWatchId] = useState<any>(null);\n  const [payPhone, setPayPhone] = useState("");');
  r = r.split('.eq("delivery_status", "requested")').join('.eq("delivery_status", "requested")');
  r = r.split('select("*, vendors(shop_name, pay_phone)")').join('select("*, vendors(shop_name, pay_phone, lat, lng)")');
  r = r.split('  const subActive =').join(`  const toggleShare = () => {
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
  const subActive =`);
  r = r.split('{online ? <Button variant="outline" onClick={() => setStatus("offline")}>Go offline</Button> : <Button onClick={() => setStatus("available")}>Go online</Button>}').join('{online ? <Button variant="outline" onClick={() => setStatus("offline")}>Go offline</Button> : <Button onClick={() => setStatus("available")}>Go online</Button>}\n        {watchId != null ? <Button variant="outline" onClick={toggleShare}>Stop sharing location</Button> : <Button variant="outline" onClick={toggleShare}>Share live location</Button>}');
  r = r.split('            <p className="mt-1 text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>\n            <div className="mt-2 flex gap-2">\n              <Button size="sm" disabled={!online || !subActive} onClick={() => accept(o)}>Accept delivery</Button>').join('            <p className="mt-1 text-xs text-muted-foreground">Drop at: {o.delivery_location}</p>\n            {myPos && o.vendors && o.vendors.lat != null ? (() => { const km = haversineKm(myPos.lat, myPos.lng, Number(o.vendors.lat), Number(o.vendors.lng)); return <p className="mt-1 text-xs font-semibold text-accent-deep">{km.toFixed(1)} km away · ~{etaMin(km)} min · fare {formatKes(feeForKm(km))}</p>; })() : null}\n            <div className="mt-2 flex gap-2">\n              <Button size="sm" disabled={!online || !subActive} onClick={() => accept(o)}>Accept delivery</Button>');
  r = r.split('      <h2 className="mt-6 font-semibold">Active deliveries</h2>').join(`      <h2 className="mt-6 font-semibold">Live map</h2>
      <div className="mt-2"><LiveMap points={[...(myPos ? [{ lat: myPos.lat, lng: myPos.lng, color: "#25D366", label: "You" }] : []), ...(open || []).filter((o: any) => o.vendors && o.vendors.lat != null).map((o: any) => ({ lat: Number(o.vendors.lat), lng: Number(o.vendors.lng), color: "#0f766e", label: "Pickup: " + (o.vendors.shop_name || "") }))]} /></div>
      <h2 className="mt-6 font-semibold">Active deliveries</h2>`);
  fs.writeFileSync('src/routes/_authenticated/rider.tsx', r);
  console.log('Rider: live GPS + nearest-order fare/ETA + map');
}
console.log('DONE');