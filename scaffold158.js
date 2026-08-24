import fs from 'fs';

// ---- Social: portrait/FB video + TikTok comments sheet + ensure upload ----
let s = fs.readFileSync('src/routes/social.tsx', 'utf8');
if (!s.includes('VideoUpload')) {
  s = s.split('import { ImageUpload } from "@/components/image-upload";').join('import { ImageUpload } from "@/components/image-upload";\nimport { VideoUpload } from "@/components/video-upload";');
  s = s.split('{kind === "video" ? <div><Label>Video link</Label><Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://...mp4" /></div> : null}').join('{kind === "video" ? (<div><Label>Upload video</Label><VideoUpload value={mediaUrl} onChange={setMediaUrl} /><p className="mt-1 text-xs text-muted-foreground">or paste a link instead</p><Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://...mp4" /></div>) : null}');
}
// Facebook-style video that handles portrait + landscape
if (!s.includes('object-contain')) {
  s = s.split('<video src={p.media_url} controls autoPlay muted loop playsInline className="mt-3 w-full rounded-xl border border-border" />').join('<div className="mt-3 w-full overflow-hidden rounded-xl bg-black"><video src={p.media_url} controls autoPlay muted loop playsInline className="mx-auto max-h-[75vh] w-full object-contain" /></div>');
}
// TikTok-style bottom-sheet comments
if (!s.includes('rounded-t-3xl bg-card')) {
  s = s.split('              <div className="mt-3 space-y-2 border-t border-border pt-3">').join('              <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpenComments(null)}>\n              <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[70vh] max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-4" onClick={(e) => e.stopPropagation()}>\n              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />\n              <p className="text-center text-sm font-semibold">{(commentsByPost[p.id] || []).length} comments</p>\n              <div className="mt-3 space-y-2">');
  s = s.split('placeholder="Write a comment..." /><Button onClick={() => submitComment(p.id, null)}>Comment</Button></div>\n              </div>').join('placeholder="Add a comment..." /><Button onClick={() => submitComment(p.id, null)}>Post</Button></div>\n              </div>\n              </div>');
}
fs.writeFileSync('src/routes/social.tsx', s);
console.log('Social: portrait video + TikTok comments + upload');

// ---- Vendor: inline create-shop form for brand-new accounts ----
let v = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (v.includes('No trader shop yet')) {
  v = v.split('  if (!vendor) return (\n    <div className="mx-auto max-w-md px-4 py-16 text-center">\n      <Store className="mx-auto size-12 text-accent" />\n      <h1 className="mt-3 font-display text-2xl font-bold">No trader shop yet</h1>\n      <p className="mt-2 text-sm text-muted-foreground">Open your digital stall in 3 minutes and start selling to all of Kenya.</p>\n      <Button asChild className="mt-4"><Link to="/sell">Open a shop</Link></Button>\n    </div>\n  );').join('  if (!vendor) return (\n    <div className="mx-auto max-w-md px-4 py-16">\n      <div className="rounded-3xl border border-border bg-card p-6 text-center">\n        <Store className="mx-auto size-12 text-accent" />\n        <h1 className="mt-3 font-display text-2xl font-bold">Open your trader shop</h1>\n        <p className="mt-2 text-sm text-muted-foreground">Name your shop and start selling to all of Kenya in 3 minutes.</p>\n        <div className="mt-4 space-y-3 text-left">\n          <div><Label>Shop name</Label><Input value={newShop} onChange={(e) => setNewShop(e.target.value)} placeholder="e.g. Mama Mboga Stall" /></div>\n          <Button className="w-full" onClick={openShop}>Create my shop</Button>\n        </div>\n      </div>\n    </div>\n  );');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', v);
  console.log('Vendor: inline create-shop form for new accounts');
}
console.log('DONE');