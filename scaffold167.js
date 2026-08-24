import fs from 'fs';
fs.writeFileSync('src/components/video-upload.tsx', `import { useRef, useState } from "react";
import { toast } from "sonner";
import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLInputElement | null>(null);
  const pick = async (file: File) => {
    if (file.size > 1024 * 1024 * 1024) return toast.error("Video too large - keep it under 1GB");
    setBusy(true); setProgress(0);
    const objectName = "vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
    const { data } = await supabase.auth.getSession();
    const token = data && data.session ? data.session.access_token : SUPABASE_ANON;
    const upload = new tus.Upload(file, SUPABASE_URL + "/storage/v1/upload/resumable", {
      headers: { apikey: SUPABASE_ANON, authorization: "Bearer " + token, "x-upsert": "true" },
      uploadDataDuringCreation: true,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: { bucketName: "videos", objectName, contentType: file.type || "video/mp4", cacheControl: "3600" },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => { setBusy(false); toast.error("Upload failed: " + String(err)); },
      onProgress: (bytesUploaded, bytesTotal) => { setProgress(Math.round((bytesUploaded / bytesTotal) * 100)); },
      onSuccess: () => { onChange(SUPABASE_URL + "/storage/v1/object/public/videos/" + objectName); setBusy(false); setProgress(100); toast.success("Video uploaded"); },
    });
    upload.start();
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading " + progress + "%" : value ? "Change video" : "Upload video"}</Button>
      {busy ? <div className="mt-2 h-1.5 w-full rounded bg-secondary"><div className="h-1.5 rounded bg-accent" style={{ width: progress + "%" }} /></div> : null}
      <p className="mt-1 text-xs text-muted-foreground">Long videos upload in resumable chunks - up to 1GB / 10+ minutes.</p>
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
`);
console.log('DONE: resumable chunked video upload (up to 1GB)');