import fs from 'fs';

// Restore the simple client-side owner check
const adminTs = `export const ADMIN_EMAIL = "njorastephen1@gmail.com";
export const isAdminEmail = (email?: string | null) => email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
`;
fs.writeFileSync('src/lib/admin.ts', adminTs);

// Fix use-is-admin.ts to use the simple check
const useIsAdmin = `import { useQuery } from "@tanstack/react-query";
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
  return !!(data || []).find((a: any) => a.email.toLowerCase() === (email || "").toLowerCase());
}
`;
fs.writeFileSync('src/lib/use-is-admin.ts', useIsAdmin);

// Restore admin.tsx to use the simple check
const adminTsx = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
let fixed = adminTsx;

// Add the import if missing
if (!fixed.includes('import { isAdminEmail } from "@/lib/admin"')) {
  fixed = fixed.split('import { useIsAdmin }').join('import { isAdminEmail } from "@/lib/admin";\nimport { useIsAdmin }');
}

// Replace the complex owners check with the simple one
fixed = fixed.replace(/const \{ data: ownerCheck \} = useQuery\([^)]+\);\nconst isOwner = ownerCheck\?\.isOwner \|\| false;/, 'const isOwner = isAdminEmail(email || "");');

// Make sure isOwner is derived if not already there
if (!fixed.includes('const isOwner = isAdminEmail')) {
  fixed = fixed.split('const isAdm = useIsAdmin(email);').join('const isAdm = useIsAdmin(email);\nconst isOwner = isAdminEmail(email || "");');
}

fs.writeFileSync('src/routes/_authenticated/admin.tsx', fixed);
console.log('admin management restored to working state');