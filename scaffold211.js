import fs from 'fs';
const f = 'src/routes/product.$id.tsx';
let c = fs.readFileSync(f, 'utf8');

// state for the small video player
if (!c.includes('const [playVid, setPlayVid]')) {
  c = c.split('const [showVideo, setShowVideo] = useState(false);').join('const [showVideo, setShowVideo] = useState(false);\n  const [playVid, setPlayVid] = useState<string | null>(null);');
  console.log('playVid state added');
}

// main viewer: photos only (never replaced by video)
const OLDMAIN = '{gallery[img] ? (isVid(gallery[img]) ? <video src={gallery[img]} controls playsInline className="aspect-[4/3] w-full bg-black object-contain" /> : <img src={gallery[img]} alt={product.title} className="aspect-[4/3] w-full object-cover" />) : <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground"><ShoppingBasket className="size-16" /></div>}';
const NEWMAIN = '{(() => { const m = gallery[img] && !isVid(gallery[img]) ? gallery[img] : (product.image_url || gallery.find((x: string) => !isVid(x)) || ""); return m ? <img src={m} alt={product.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground"><ShoppingBasket className="size-16" /></div>; })()}';
if (c.includes(OLDMAIN)) { c = c.split(OLDMAIN).join(NEWMAIN); console.log('main viewer photo-only'); }

// thumbnails: video tiles open the small player, photo tiles swap the main image
c = c.split('<button key={i} onClick={() => setImg(i)} className={"size-16 shrink-0 overflow-hidden rounded-lg border-2 " + (i === img ? "border-accent" : "border-border")}>').join('<button key={i} onClick={() => (isVid(g) ? setPlayVid(g) : setImg(i))} className={"size-16 shrink-0 overflow-hidden rounded-lg border-2 " + (i === img ? "border-accent" : "border-border")}>');

// small video player below thumbnails
const ANCHOR = '            </div>\n          )}\n        </div>\n        <div>\n          <div className="flex flex-wrap gap-2 text-xs">';
const PLAYER = '            </div>\n          )}\n          {playVid ? (\n            <div className="mt-3 w-full max-w-[280px] overflow-hidden rounded-xl border border-border bg-black">\n              <video src={playVid} controls autoPlay playsInline className="w-full" />\n              <button onClick={() => setPlayVid(null)} className="w-full bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground">Close video</button>\n            </div>\n          ) : null}\n        </div>\n        <div>\n          <div className="flex flex-wrap gap-2 text-xs">';
if (c.includes(ANCHOR)) { c = c.split(ANCHOR).join(PLAYER); console.log('small video player added'); }

fs.writeFileSync(f, c);
console.log('DONE');