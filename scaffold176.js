import fs from 'fs';
fs.writeFileSync('src/components/video-upload.tsx', `import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const DIRECT = 45 * 1024 * 1024;
const MAX = 200 * 1024 * 1024;
let ffmpegPromise: any = null;
function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ff = new FFmpeg();
      const base = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      await ff.load({ coreURL: await toBlobURL(base + "/ffmpeg-core.js", "text/javascript"), wasmURL: await toBlobURL(base + "/ffmpeg-core.wasm", "application/wasm") });
      return ff;
    })();
  }
  return ffmpegPromise;
}
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLInputElement | null>(null);
  const finish = (url: string) => { onChange(url); setBusy(false); setProgress(0); setStage(""); toast.success("Video ready"); };
  const fail = (msg?: string) => { setBusy(false); setProgress(0); setStage(""); toast.error(msg || "Upload failed. Try a shorter clip or paste a YouTube/Vimeo link."); };
  const uploadToSupabase = async (blob: Blob, name: string): Promise<string | null> => {
    const objectName = "vid-" + Date.now() + "-" + name.replace(/[^a-zA-Z0-9.]+/g, "-");
    const { error } = await supabase.storage.from("videos").upload(objectName, blob, { contentType: "video/mp4" });
    if (error) return null;
    const { data } = supabase.storage.from("videos").getPublicUrl(objectName);
    return data.publicUrl;
  };
  const uploadToR2 = async (blob: Blob, name: string): Promise<string | null> => {
    try {
      const pr = await fetch("/api/r2-presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type: "video/mp4", size: blob.size }) });
      const pd = await pr.json().catch(() => ({} as any));
      if (!pr.ok || !pd.uploadUrl) return null;
      const ok = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", pd.uploadUrl);
        xhr.setRequestHeader("Content-Type", "video/mp4");
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
        xhr.onerror = () => resolve(false);
        xhr.send(blob);
      });
      return ok ? pd.publicUrl : null;
    } catch (e) { return null; }
  };
  const pick = async (file: File) => {
    if (file.size > MAX) return toast.error("For videos over 200MB, paste a YouTube or Vimeo link - it plays perfectly in your ad.");
    setBusy(true); setProgress(0);
    try {
      if (file.size <= DIRECT) {
        setStage("Uploading");
        const url = await uploadToSupabase(file, file.name);
        if (!url) { fail(); return; }
        finish(url);
        return;
      }
      setStage("Compressing");
      const { fetchFile } = await import("@ffmpeg/util");
      const ff = await getFFmpeg();
      ff.on("progress", ({ progress: pg }: any) => setProgress(Math.max(1, Math.min(99, Math.round(pg * 100)))));
      await ff.writeFile("in.mp4", await fetchFile(file));
      await ff.exec(["-i", "in.mp4", "-vf", "scale=-2:480", "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "700k", "-c:a", "aac", "-b:a", "96k", "out.mp4"]);
      const out: any = await ff.readFile("out.mp4");
      const blob = new Blob([out], { type: "video/mp4" });
      setStage("Uploading"); setProgress(0);
      let url = blob.size <= DIRECT ? await uploadToSupabase(blob, file.name) : await uploadToR2(blob, file.name);
      if (!url) url = await uploadToR2(blob, file.name);
      if (!url) { fail("Compressed video still too large for free storage - paste a YouTube/Vimeo link instead."); return; }
      finish(url);
    } catch (e) {
      console.error(e);
      fail("This device cannot compress the video - paste a YouTube/Vimeo link instead.");
    }
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pick(f); }} />
      <Button type="button" variant="outline" onClick={() => ref.current && ref.current.click()} disabled={busy}>{busy ? stage + " " + progress + "%" : value ? "Change video" : "Upload video"}</Button>
      {busy ? <div className="mt-2 h-1.5 w-full rounded bg-secondary"><div className="h-1.5 rounded bg-accent" style={{ width: progress + "%" }} /></div> : null}
      <p className="mt-1 text-xs text-muted-foreground">Up to 45MB uploads instantly. 45-200MB is auto-compressed on your device first. Over 200MB, paste a YouTube/Vimeo link.</p>
      {value ? <video src={value} controls className="mt-2 max-w-[240px] rounded-xl border border-border" /> : null}
    </div>
  );
}
`);
console.log('DONE: on-device auto-compression for 45-200MB videos');