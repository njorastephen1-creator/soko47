import { useEffect, useRef } from "react";
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
