import fs from 'fs';
const log = (m) => console.log(m);

// ---------- VENDOR: category-smart units + labels ----------
const vf = 'src/routes/_authenticated/vendor.tsx';
let v = fs.readFileSync(vf, 'utf8');
if (!v.includes('function unitOptions')) {
  v = v.split('export const Route = createFileRoute').join(`const SERVICE_CATS = ["services","repair","kinyozi","salon","laundry","fundi","carwash","boda","matatu","mpesaagent","water","cyber","ecitizen","photo","clearing","logistics"];
function unitOptions(cat: string): string[] {
  if (cat === "houses") return ["unit", "room", "1/8 acre", "1/4 acre", "acre", "m²"];
  if (cat === "cars") return ["unit"];
  if (SERVICE_CATS.includes(cat)) return ["job", "visit", "hour", "day"];
  return ["piece", "kg", "kiondo", "crate", "dozen", "bag"];
}
export const Route = createFileRoute`);
  log('vendor: unitOptions added');
}
if (v.includes('{["piece", "kg", "kiondo", "crate", "dozen", "bag"].map((u) => (')) {
  v = v.split('{["piece", "kg", "kiondo", "crate", "dozen", "bag"].map((u) => (').join('{unitOptions(np.category).map((u) => (');
  log('vendor: unit chips now dynamic');
}
v = v.split('setNp({ ...np, category: c[0] })').join('setNp({ ...np, category: c[0], unit: unitOptions(c[0])[0] })');
v = v.split('unit: np.unit').join('unit: unitOptions(np.category).includes(np.unit) ? np.unit : unitOptions(np.category)[0]');
if (v.includes('<div><Label>Stock</Label>')) {
  v = v.split('<div><Label>Stock</Label>').join('<div><Label>{np.category === "houses" || np.category === "cars" ? "Units available" : SERVICE_CATS.includes(np.category) ? "Slots per day" : "Stock"}</Label>');
  log('vendor: stock label smart');
}
fs.writeFileSync(vf, v);

// ---------- ENRICH: 48MB + unlimited gallery videos ----------
const ef = 'src/routes/_authenticated/enrich.$id.tsx';
let e = fs.readFileSync(ef, 'utf8');
e = e.split('if (file.size > 20 * 1024 * 1024) return toast.error("Video too big - max 20MB");').join('if (file.size > 48 * 1024 * 1024) return toast.error("Video too big - max 48MB");');
e = e.split('if (dur > 90.5) { toast.error("Video too long - max 1 minute 30 seconds"); return; }').join('');
if (!e.includes('pickGalleryVideo')) {
  e = e.split('const pickVideo = async').join(`const pickGalleryVideo = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    if (file.size > 48 * 1024 * 1024) return toast.error("Video too big - max 48MB");
    setUploading(true);
    try {
      const path = "gal-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
      if (error) { toast.error(error.message); return; }
      const pub = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
      await addPhoto(pub);
      toast.success("Video added to gallery");
    } catch { toast.error("Could not upload video"); }
    finally { setUploading(false); }
  };
  const pickVideo = async`);
  e = e.split('<input type="file" accept="video/*" className="hidden" onChange={pickVideo} disabled={uploading} />').join('<input type="file" accept="video/*" className="hidden" onChange={pickVideo} disabled={uploading} />\n        <Button type="button" variant="outline" className="mt-2" onClick={() => (document.getElementById("galvid") as HTMLInputElement)?.click()}>{uploading ? "Uploading..." : "Add video to gallery"}</Button>\n        <input id="galvid" type="file" accept="video/*" className="hidden" onChange={pickGalleryVideo} disabled={uploading} />');
  log('enrich: gallery video upload added');
}
fs.writeFileSync(ef, e);

// ---------- PRODUCT PAGE: render videos inside gallery ----------
const pf = 'src/routes/product.$id.tsx';
let p = fs.readFileSync(pf, 'utf8');
if (!p.includes('const isVid')) {
  p = p.split('const gallery = ').join('const isVid = (u: string) => /\\.mp4(\\?|$)|\\/videos\\//.test(u || "");\n  const gallery = ');
  log('product: isVid helper added');
}
p = p.replace(/<img src=\{gallery\[img\]\}[^>]*\/>/g, (m) => '{isVid(gallery[img]) ? <video src={gallery[img]} controls playsInline className="aspect-[4/3] w-full bg-black object-contain" /> : ' + m + '}');
p = p.replace(/<img src=\{g\}[^>]*\/>/g, (m) => '{isVid(g) ? <video src={g} muted playsInline preload="metadata" className="size-full object-cover" /> : ' + m + '}');
fs.writeFileSync(pf, p);
log('product: gallery renders videos inline');
console.log('DONE');