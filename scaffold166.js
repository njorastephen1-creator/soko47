import fs from 'fs';
const f = 'src/components/video-upload.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('if (file.size > 500 * 1024 * 1024) return toast.error("Video too large - keep it under 500MB");').join('if (file.size > 1024 * 1024 * 1024) return toast.error("Video too large - keep it under 1GB");');
c = c.split('if (error) { setBusy(false); return toast.error(error.message); }').join('if (error) { setBusy(false); return toast.error(String(error.message).includes("maximum allowed size") ? "Video too big for the current storage plan. Raise the limit in Supabase Dashboard > Storage, compress the clip, or paste a link instead." : error.message); }');
c = c.split('<Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading..." : value ? "Change video" : "Upload video"}</Button>').join('<Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading..." : value ? "Change video" : "Upload video"}</Button>\n      <p className="mt-1 text-xs text-muted-foreground">Up to 1GB / long videos - if an upload is rejected, raise the storage limit in Supabase or paste a link.</p>');
fs.writeFileSync(f, c);
console.log('DONE: video cap 1GB + clearer limit error');