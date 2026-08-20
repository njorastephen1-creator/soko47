import fs from 'fs';
let enrich = fs.readFileSync('src/routes/_authenticated/enrich.$id.tsx', 'utf8');
let changed = false;
if (!enrich.includes('pickVideo')) {
  enrich = enrich.split('  const save = async () => {').join(`  const [uploading, setUploading] = useState(false);
  const pickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("Video too big - max 20MB");
    setUploading(true);
    try {
      const dur = await new Promise<number>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
        v.onerror = () => reject(new Error("bad"));
        v.src = url;
      });
      if (dur > 90.5) { toast.error("Video too long - max 1 minute 30 seconds"); return; }
      const path = session!.user.id + "-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
      if (error) { toast.error(error.message); return; }
      const pub = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
      setForm({ ...f, video_url: pub });
      toast.success("Video attached (" + Math.round(dur) + "s)");
    } catch { toast.error("Could not read that video file"); }
    finally { setUploading(false); }
  };
  const save = async () => {`);
  enrich = enrich.split(`        <div>
          <Label className="flex items-center gap-1"><Video className="size-4" /> Product video (YouTube or mp4 link)</Label>
          <Input value={f.video_url} onChange={(e) => setForm({ ...f, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=... or https://.../video.mp4" />
        </div>`).join(`        <div>
          <Label className="flex items-center gap-1"><Video className="size-4" /> Product video (max 1 min 30 sec)</Label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:bg-secondary/70">
              {uploading ? "Uploading..." : "Upload video"}
              <input type="file" accept="video/*" className="hidden" onChange={pickVideo} disabled={uploading} />
            </label>
            <span className="text-[11px] text-muted-foreground">or paste a YouTube/mp4 link</span>
          </div>
          <Input className="mt-2" value={f.video_url} onChange={(e) => setForm({ ...f, video_url: e.target.value })} placeholder="Video link (optional if you uploaded)" />
          {f.video_url ? <p className="mt-1 truncate text-[11px] text-success">Video attached: {f.video_url}</p> : null}
        </div>`);
  changed = true;
}
if (changed) { fs.writeFileSync('src/routes/_authenticated/enrich.$id.tsx', enrich); console.log('DONE: video upload with 90s limit'); }
else console.log('already present');