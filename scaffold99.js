import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
let n = 0;
if (!c.includes('showProfile')) {
  c = c.split('.select("shop_name, user_id, profile_image_url")').join('.select("shop_name, user_id, profile_image_url, slug, market_name, county_slug, rating_sum, rating_count")');
  c = c.split('  const [selectedId, setSelectedId] = useState<string | null>(null);').join('  const [selectedId, setSelectedId] = useState<string | null>(null);\n  const [showProfile, setShowProfile] = useState(false);');
  c = c.split('  const doCopy = () => {').join(`  const clearChat = async () => {
    if (!window.confirm("Clear ALL messages in this chat for both sides?")) return;
    await supabase.from("messages").delete().eq("vendor_id", vendorId).eq("buyer_id", buyerId);
    setShowProfile(false);
    qc.invalidateQueries();
    toast.success("Chat cleared");
  };
  const doCopy = () => {`);
  c = c.split('{otherPhoto ? <img src={otherPhoto} alt="" className="size-10 rounded-full object-cover" /> : <span className="flex size-10 items-center justify-center rounded-full bg-white/20 font-display font-bold">{otherInitial}</span>}').join('{otherPhoto ? <img src={otherPhoto} alt="" onClick={() => setShowProfile(!showProfile)} className="size-10 cursor-pointer rounded-full object-cover" /> : <span onClick={() => setShowProfile(!showProfile)} className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/20 font-display font-bold">{otherInitial}</span>}');
  c = c.split('        <div className="flex-1">\n          <p className="font-semibold">{otherName}</p>').join('        <div className="flex-1 cursor-pointer" onClick={() => setShowProfile(!showProfile)}>\n          <p className="font-semibold">{otherName}</p>');
  c = c.split('      </div>\n      <div className="flex-1 space-y-2 overflow-y-auto p-4"').join(`      </div>
      {showProfile ? (
        <div className="max-h-[45vh] overflow-y-auto border-b border-border bg-card p-4">
          <div className="flex flex-col items-center text-center">
            {otherPhoto ? <img src={otherPhoto} alt="" className="size-24 rounded-full object-cover ring-4 ring-accent/20" /> : <span className="flex size-24 items-center justify-center rounded-full bg-accent/15 font-display text-3xl font-bold text-accent-deep">{otherInitial}</span>}
            <p className="mt-2 font-display text-lg font-bold">{otherName}</p>
            {vendor && !iAmVendor ? <p className="text-xs text-muted-foreground">{vendor.market_name || "Soko47 trader"} · ⭐ {Number(vendor.rating_count) > 0 ? (Number(vendor.rating_sum) / Number(vendor.rating_count)).toFixed(1) : "New"}</p> : null}
            {vendor && iAmVendor ? <p className="text-xs text-muted-foreground">Your customer</p> : null}
            {vendor && !iAmVendor ? <a href={"/shop/" + vendor.slug} className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Visit shop</a> : null}
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Media in this chat</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(msgs || []).filter((m: any) => m.attachment_url).map((m: any) => (
              m.attachment_type === "video" ? <video key={m.id} src={m.attachment_url} className="aspect-square w-full rounded-lg object-cover" /> : <a key={m.id} href={m.attachment_url} target="_blank" rel="noreferrer"><img src={m.attachment_url} alt="" className="aspect-square w-full rounded-lg object-cover" /></a>
            ))}
            {(msgs || []).filter((m: any) => m.attachment_url).length === 0 && <p className="col-span-3 text-xs text-muted-foreground">No media shared yet.</p>}
          </div>
          <button onClick={clearChat} className="mt-4 w-full rounded-xl border border-destructive/40 py-2 text-sm font-semibold text-destructive">🚫 Clear chat</button>
        </div>
      ) : null}
      <div className="flex-1 space-y-2 overflow-y-auto p-4"`);
  n++;
}
fs.writeFileSync(f, c);
console.log('DONE:', n, 'WhatsApp-style contact profile sheet');