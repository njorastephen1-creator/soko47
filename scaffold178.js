import fs from 'fs';
fs.writeFileSync('src/components/video-upload.tsx', `import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const MAX = 45 * 1024 * 1024;
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLInputElement | null>(null);
  const finish = (url: string) => { onChange(url); setBusy(false); setProgress(0); toast.success("Video ready"); };
  const fail = (msg?: string) => { setBusy(false); setProgress(0); toast.error(msg || "Upload failed. Try a shorter clip or paste a YouTube/Vimeo link."); };
  const pick = async (file: File) => {
    if (file.size > MAX) return toast.error("Your clip should not be more than 45MB till further notice. For longer videos, paste a YouTube/Vimeo link.");
    setBusy(true); setProgress(0);
    const objectName = "vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
    const xhr = new XMLHttpRequest();
    const { data: tokenData } = await supabase.auth.getSession();
    const url = SUPABASE_UPLOAD(objectName, file.type || "video/mp4");
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data } = supabase.storage.from("videos").getPublicUrl(objectName);
        finish(data.publicUrl);
      } else fail();
    };
    xhr.onerror = () => fail();
    const { error } = await supabase.storage.from("videos").upload(objectName, file, { contentType: file.type || "video/mp4" });
    if (error) { fail(error.message); return; }
    const { data } = supabase.storage.from("videos").getPublicUrl(objectName);
    finish(data.publicUrl);
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? "Uploading " + progress + "%" : value ? "Change video" : "Upload video"}</Button>
      {busy ? <div className="mt-2 h-1.5 w-full rounded bg-secondary"><div className="h-1.5 rounded bg-accent" style={{ width: progress + "%" }} /></div> : null}
      <p className="mt-1 text-xs text-muted-foreground">Clips up to 45MB upload instantly. For longer videos, paste a YouTube/Vimeo link.</p>
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
function SUPABASE_UPLOAD(objectName: string, type: string) { return ""; }
const env = (import.meta as any).env || {};
`);
console.log('DONE: 45MB cap with clear notice');