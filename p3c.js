import fs from 'fs';

// 1) Create a server endpoint that checks ownership without exposing the email
fs.writeFileSync('api/check-owner.js', `import { createClient } from "@supabase/supabase-js";

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
`);
console.log('api/check-owner.js created');

// 2) Update use-is-admin.ts to use the server endpoint for owner check
const useIsAdmin = `import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin(email: string | undefined) {
  const { data: ownerCheck } = useQuery({
    queryKey: ["owner-check", email],
    enabled: !!email,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { isOwner: false };
      const r = await fetch("/api/check-owner", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.access_token }
      });
      return await r.json();
    },
  });
  
  const { data: adminRows } = useQuery({
    queryKey: ["admins-list"],
    enabled: !!email && !ownerCheck?.isOwner,
    queryFn: async () => {
      const { data } = await supabase.from("admins").select("email");
      return data || [];
    },
  });
  
  if (ownerCheck?.isOwner) return true;
  return !!(adminRows || []).find((a: any) => a.email.toLowerCase() === (email || "").toLowerCase());
}
`;

fs.writeFileSync('src/lib/use-is-admin.ts', useIsAdmin);
console.log('use-is-admin.ts: owner check moved server-side');

// 3) Delete the old admin.ts file (or update admin.tsx to not import it)
const adminTsx = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
const newAdminTsx = adminTsx
  .split('import { isAdminEmail } from "@/lib/admin";')
  .join('')
  .split('const isOwner = isAdminEmail(email || "");')
  .join('const { data: ownerCheck } = useQuery({ queryKey: ["owner-check", email], enabled: !!email, queryFn: async () => { const { data: { session } } = await supabase.auth.getSession(); if (!session) return { isOwner: false }; const r = await fetch("/api/check-owner", { method: "POST", headers: { Authorization: "Bearer " + session.access_token } }); return await r.json(); } });\nconst isOwner = ownerCheck?.isOwner || false;');

fs.writeFileSync('src/routes/_authenticated/admin.tsx', newAdminTsx);
console.log('admin.tsx: owner check updated');