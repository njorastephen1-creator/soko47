import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
  res.status(200).json({ uploadUrl, publicUrl: R2_PUBLIC_URL.replace(/\/$/, "") + "/" + key });
}
