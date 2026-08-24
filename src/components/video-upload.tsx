import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";
const MAX = 900 * 1024 * 1024;
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLInputElement | null>(null);
  const finish = (url: string) => { onChange(url); setBusy(false); setProgress(100); toast.success("Video ready"); };
  const fail = () => { setBusy(false); setProgress(0); toast.error("Upload failed. Try a shorter or compressed clip, or paste a link instead."); };
  const pick = async (file: File) => {
    if (file.size > MAX) return toast.error("This video is too large. Please choose a shorter or compressed clip.");
    setBusy(true); setProgress(0);
    const objectName = "vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
    if (file.size <= 45 * 1024 * 1024) {
      const { error } = await supabase.storage.from("videos").upload(objectName, file, { contentType: file.type || "video/mp4" });
      if (error) { fail(); return; }
      const { data } = supabase.storage.from("videos").getPublicUrl(objectName);
      finish(data.publicUrl);
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      const token = data && data.session ? data.session.access_token : SUPABASE_ANON;
      let started = false;
      let wd: any = null;
      const upload = new Upload(file, SUPABASE_URL + "/storage/v1/upload/resumable", {
        headers: { apikey: SUPABASE_ANON, authorization: "Bearer " + token, "x-upsert": "true" },
        uploadDataDuringCreation: true,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: { bucketName: "videos", objectName, contentType: file.type || "video/mp4", cacheControl: "3600" },
        chunkSize: 6 * 1024 * 1024,
        onError: () => { if (wd) clearTimeout(wd); fail(); },
        onProgress: (b: number, t: number) => { started = true; setProgress(Math.round((b / t) * 100)); },
        onSuccess: () => { if (wd) clearTimeout(wd); finish(SUPABASE_URL + "/storage/v1/object/public/videos/" + objectName); },
      });
      wd = setTimeout(() => { if (!started) { try { upload.abort(); } catch (e) {} fail(); } }, 25000);
      upload.start();
    } catch (e) {
      console.error("video upload error", e);
      fail();
    }
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading " + progress + "%" : value ? "Change video" : "Upload video"}</Button>
      {busy ? <div className="mt-2 h-1.5 w-full rounded bg-secondary"><div className="h-1.5 rounded bg-accent" style={{ width: progress + "%" }} /></div> : null}
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
