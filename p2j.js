import fs from 'fs';
const f = 'api/r2-presign.js';
let c = `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

const MAX_SIZE = 48 * 1024 * 1024; // 48MB
const ALLOWED_TYPES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
  "video/mp4": ["mp4", "m4v"],
  "video/webm": ["webm"],
  "video/quicktime": ["mov"],
};

// Simple in-memory rate limiter (per IP, resets every minute)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false; // 10 uploads per minute per IP
  entry.count++;
  return true;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  // Rate limit
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) return res.status(429).json({ error: "too many requests, wait a minute" });

  // Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "authentication required" });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "invalid token" });

  // Validate environment
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
    return res.status(503).json({ error: "R2 not configured" });
  }

  const { name, type, size, media_type } = req.body || {};
  
  // Validate size
  if (!size || size > MAX_SIZE) {
    return res.status(413).json({ error: "file too large, max 48MB" });
  }

  // Validate MIME type
  if (!type || !ALLOWED_TYPES[type]) {
    return res.status(400).json({ error: "file type not allowed" });
  }

  // Validate extension matches MIME type
  const ext = String(name || "file").split(".").pop()?.toLowerCase();
  const allowedExts = ALLOWED_TYPES[type];
  if (!ext || !allowedExts.includes(ext)) {
    return res.status(400).json({ error: "file extension does not match type" });
  }

  // Build key with user isolation
  const prefix = media_type === "gallery" ? "gal" : (type.startsWith("video/") ? "vid" : "img");
  const safeName = String(name || "file").replace(/[^a-zA-Z0-9._-]+/g, "-");
  const key = \`\${prefix}-\${user.id.slice(0, 8)}-\${Date.now()}-\${safeName}\`;

  const client = new S3Client({
    region: "auto",
    endpoint: \`https://\${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: type }),
    { expiresIn: 900 }
  );

  res.status(200).json({ 
    uploadUrl, 
    publicUrl: R2_PUBLIC_URL.replace(/\\/$/, "") + "/" + key 
  });
}
`;

fs.writeFileSync(f, c);
console.log('r2-presign.js: secured with auth, rate limiting, MIME validation, user isolation');