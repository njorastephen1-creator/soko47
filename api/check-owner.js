import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "authentication required" });
  }
  
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return res.status(401).json({ error: "invalid token" });
  
  // Check if this user is the owner (hardcoded server-side, not exposed to client)
  const isOwner = user.email === "njorastephen1@gmail.com";
  
  return res.status(200).json({ isOwner });
}
