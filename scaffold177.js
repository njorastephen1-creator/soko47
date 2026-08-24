import fs from 'fs';
fs.writeFileSync('src/components/video-upload.tsx', `import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const DIRECT = 45 * 1024 * 1024;
const MAX = 200 * 1024 * 1024;
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLInputElement | null>(null);
  const finish = (url: string) => { onChange(url); setBusy(false); setProgress(0); toast.success("Video ready"); };
  const fail = (msg?: string) => { setBusy(false); setProgress(0); toast.error(msg || "Upload failed. Try a shorter clip or paste a YouTube/Vimeo link."); };
  const pick = async (file: File) => {
    if (file.size > MAX) return toast.error("For videos over 200MB, paste a YouTube or Vimeo link - it plays perfectly in your ad.");
    setBusy(true); setProgress(0);
    const objectName = "vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
    if (file.size <= DIRECT) {
      const { error } = await supabase.storage.from("videos").upload(objectName, file, { contentType: file.type || "video/mp4" });
      if (error) { fail(error.message); return; }
      const { data } = supabase.storage.from("videos").getPublicUrl(objectName);
      finish(data.publicUrl);
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      const token = data && data.session ? data.session.access_token : SUPABASE_ANON;
      let started = false;
      const upload = new Upload(file, SUPABASE_URL + "/storage/v1/upload/resumable", {
        headers: { apikey: SUPABASE_ANON, authorization: "Bearer " + token, "x-upsert": "true" },
        uploadDataDuringCreation: true,
        retryDelays: [0, 3000, 5000, 10000],
        metadata: { bucketName: "videos", objectName, contentType: file.type || "video/mp4", cacheControl: "3600" },
        chunkSize: 6 * 1024 * 1024,
        onError: (err: any) => fail("Large upload failed: " + (err && err.message ? err.message : "check connection") + " - or paste a YouTube/Vimeo link."),
        onProgress: (b: number, t: number) => { started = true; setProgress(Math.round((b / t) * 100)); },
        onSuccess: () => finish(SUPABASE_URL + "/storage/v1/object/public/videos/" + objectName),
      });
      setTimeout(() => { if (!started) { try { upload.abort(); } catch (e) {} fail("Large upload did not start on this network - paste a YouTube/Vimeo link instead."); } }, 20000);
      upload.start();
    } catch (e) { fail("Large upload not supported here - paste a YouTube/Vimeo link instead."); }
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading " + progress + "%" : value ? "Change video" : "Upload video"}</Button>
      {busy ? <div className="mt-2 h-1.5 w-full rounded bg-secondary"><div className="h-1.5 rounded bg-accent" style={{ width: progress + "%" }} /></div> : null}
      <p className="mt-1 text-xs text-muted-foreground">Up to 45MB uploads instantly. 45-200MB uploads in resumable chunks. Over 200MB, paste a YouTube/Vimeo link.</p>
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
`);
console.log('DONE: clean resumable uploads, compression removed');