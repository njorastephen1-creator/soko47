import fs from 'fs';
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
let n = 0;
if (!prod.includes('showVideo')) {
  prod = prod.split('import { BadgeCheck, ChevronRight, MapPin, MessageCircle, Minus, Phone, Plus, ShieldCheck, ShoppingBasket, Store, Truck } from "lucide-react";').join('import { BadgeCheck, ChevronRight, MapPin, MessageCircle, Minus, Phone, Play, Plus, ShieldCheck, ShoppingBasket, Store, Truck } from "lucide-react";');
  prod = prod.split('  const [qty, setQty] = useState(1);\n  const [img, setImg] = useState(0);').join('  const [qty, setQty] = useState(1);\n  const [img, setImg] = useState(0);\n  const [showVideo, setShowVideo] = useState(false);\n  const [showDesc, setShowDesc] = useState(false);');
  prod = prod.split(`      {product.video_url ? (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">Product video</h2>
          <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-black">
            {yid ? <iframe className="aspect-video w-full" src={"https://www.youtube.com/embed/" + yid} title="Product video" allowFullScreen /> : <video controls className="aspect-video w-full" src={product.video_url} />}
          </div>
        </div>
      ) : null}`).join(`      {product.video_url ? (
        <div className="mt-10">
          {!showVideo ? (
            <button onClick={() => setShowVideo(true)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Play className="size-4" /> Watch product video
            </button>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border bg-black">
              {yid ? <iframe className="aspect-video w-full" src={"https://www.youtube.com/embed/" + yid} title="Product video" allowFullScreen /> : <video controls className="aspect-video w-full" src={product.video_url} />}
            </div>
          )}
        </div>
      ) : null}`);
  prod = prod.split('<p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{product.description || "The trader has not added a description yet."}</p>').join(`{product.description ? (
            <>
              <p className={"mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground " + (showDesc ? "" : "line-clamp-4")}>{product.description}</p>
              {product.description.length > 180 ? (
                <button onClick={() => setShowDesc(!showDesc)} className="mt-2 text-xs font-semibold text-accent-deep hover:underline">{showDesc ? "Show less" : "Show more"}</button>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">The trader has not added a description yet.</p>
          )}`);
  fs.writeFileSync('src/routes/product.$id.tsx', prod);
  n++;
  console.log('Patched product page: video button + show more/less');
}
let enrich = fs.readFileSync('src/routes/_authenticated/enrich.$id.tsx', 'utf8');
if (!enrich.includes('first = cover')) {
  enrich = enrich.split('images: (product.images as string[]) || [],').join('images: ([product.image_url].concat((product.images as string[]) || [])).filter(Boolean),');
  enrich = enrich.split('  const save = async () => {\n    const { error } = await supabase.from("products").update({').join('  const save = async () => {\n    if (!f.images || f.images.length === 0) return toast.error("Keep at least one photo");\n    const { error } = await supabase.from("products").update({');
  enrich = enrich.split('      images: f.images,').join('      image_url: f.images[0] || null,\n      images: f.images.slice(1),');
  enrich = enrich.split('<Label>Extra photos</Label>').join('<Label>Product photos (first = cover)</Label>\n          <p className="text-[11px] text-muted-foreground">Add angles, colors, sizes - all photos stay on the one listing.</p>');
  enrich = enrich.split(`              <div key={i} className="relative">
                <img src={img} alt="" className="size-16 rounded-lg border border-border object-cover" />
                <button onClick={() => setForm({ ...f, images: f.images.filter((_: string, x: number) => x !== i) })} className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"><Trash2 className="size-3" /></button>
              </div>`).join(`              <div key={i} className="relative">
                <img src={img} alt="" className="size-16 rounded-lg border border-border object-cover" />
                {i === 0 && <span className="absolute bottom-0 left-0 rounded-tr bg-primary px-1 text-[8px] font-bold text-primary-foreground">MAIN</span>}
                <button onClick={() => setForm({ ...f, images: f.images.filter((_: string, x: number) => x !== i) })} className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"><Trash2 className="size-3" /></button>
              </div>`);
  enrich = enrich.split('placeholder="e.g. RAM"').join('placeholder="What is it? e.g. Material / Size / RAM"');
  enrich = enrich.split('placeholder="e.g. 8GB"').join('placeholder="The detail e.g. Cotton / Large / 8GB"');
  fs.writeFileSync('src/routes/_authenticated/enrich.$id.tsx', enrich);
  n++;
  console.log('Patched enrich: gallery keeps all photos + clear placeholders');
}
console.log(n > 0 ? 'DONE' : 'WARNING: nothing matched');