import fs from 'fs';
fs.writeFileSync('src/lib/live.ts', `import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useLive() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("soko47-live")
      .on("postgres_changes", { event: "*", schema: "public" }, () => { qc.invalidateQueries(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}
`);
console.log('Created live engine');
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('useLive')) {
  chrome = chrome.split('import { isAdminEmail } from "@/lib/admin";').join('import { isAdminEmail } from "@/lib/admin";\nimport { useLive } from "@/lib/live";');
  chrome = chrome.split('export function SiteHeader() {\n  const [sc, setSc] = useState("all");').join('export function SiteHeader() {\n  useLive();\n  const [sc, setSc] = useState("all");');
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('Live engine mounted');
}
console.log('DONE');