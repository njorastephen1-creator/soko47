import fs from 'fs';
// useIsAdmin hook: owner OR in admins table
fs.writeFileSync('src/lib/use-is-admin.ts', `import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
export function useIsAdmin(email: string | undefined) {
  const isOwner = isAdminEmail(email || "");
  const { data } = useQuery({
    queryKey: ["admins-list"],
    enabled: !!email && !isOwner,
    queryFn: async () => { const { data } = await supabase.from("admins").select("email"); return data || []; },
  });
  if (isOwner) return true;
  return !!(data || []).find((a: any) => a.email === email);
}
`);
// print admin page gate for precise wiring next
const a = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
console.log('--- isAdmin lines ---');
a.split('\n').forEach((l, i) => { if (l.includes('isAdmin') || l.includes('isAdminEmail')) console.log(i, l.trim()); });
const g = a.indexOf('isAdmin');
console.log('--- gate region ---');
console.log(a.slice(Math.max(0, g - 400), g + 600));