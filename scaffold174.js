import fs from 'fs';
fs.writeFileSync('api/r2-presign.js', `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const MAX = 200 * 1024 * 1024;
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) { res.status(503).json({ error: "R2 not configured" }); return; }
  const { name, type, size } = req.body || {};
  if (!size || size > MAX) { res.status(413).json({ error: "too large" }); return; }
  const client = new S3Client({
    region: "auto",
    endpoint: "https://" + R2_ACCOUNT_ID + ".r2.cloudflarestorage.com",
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  const key = "vid-" + Date.now() + "-" + String(name || "video").replace(/[^a-zA-Z0-9.]+/g, "-");
  const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: type || "video/mp4" }), { expiresIn: 900 });
  res.status(200).json({ uploadUrl, publicUrl: R2_PUBLIC_URL.replace(/\\/$/, "") + "/" + key });
}
`);
fs.writeFileSync('src/components/video-upload.tsx', `import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const MAX_R2 = 200 * 1024 * 1024;
export function VideoUpload({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLInputElement | null>(null);
  const finish = (url: string) => { onChange(url); setBusy(false); setProgress(100); toast.success("Video ready"); };
  const fail = (msg?: string) => { setBusy(false); setProgress(0); toast.error(msg || "Upload failed. Try a shorter clip or paste a YouTube/Vimeo link."); };
  const pick = async (file: File) => {
    if (file.size > MAX_R2) return toast.error("For videos over 200MB, paste a YouTube or Vimeo link - it plays perfectly in your ad.");
    setBusy(true); setProgress(0);
    if (file.size <= 45 * 1024 * 1024) {
      const objectName = "vid-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]+/g, "-");
      const { error } = await supabase.storage.from("videos").upload(objectName, file, { contentType: file.type || "video/mp4" });
      if (error) { fail(); return; }
      const { data } = supabase.storage.from("videos").getPublicUrl(objectName);
      finish(data.publicUrl);
      return;
    }
    try {
      const pr = await fetch("/api/r2-presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, type: file.type || "video/mp4", size: file.size }) });
      const pd = await pr.json().catch(() => ({} as any));
      if (!pr.ok || !pd.uploadUrl) { fail(pd.error === "R2 not configured" ? "Large direct uploads switch on soon - for now paste a YouTube/Vimeo link and it plays perfectly." : undefined); return; }
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", pd.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) finish(pd.publicUrl); else fail(); };
      xhr.onerror = () => fail();
      xhr.send(file);
    } catch (e) { fail(); }
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
`);
console.log('DONE: graceful video uploads without R2');