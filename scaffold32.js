import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
let changed = false;
if (!chrome.includes('useQuery')) {
  chrome = chrome.split('import { useState } from "react";').join('import { useState } from "react";\nimport { useQuery } from "@tanstack/react-query";');
  changed = true;
}
if (chrome.includes('const firstName = (session?.user_metadata?.full_name || "").split(" ")[0];')) {
  chrome = chrome.split('const firstName = (session?.user_metadata?.full_name || "").split(" ")[0];').join(`const fullName = (session?.user_metadata?.full_name as string) || (session?.user?.email || "").split("@")[0] || "trader";
  const { data: myVendor } = useQuery({
    queryKey: ["my-vendor", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id").eq("user_id", session!.user.id).maybeSingle();
      return data || null;
    },
  });
  const role = myVendor ? "Trader" : "Buyer";`);
  changed = true;
}
if (chrome.includes('Hello, {firstName || "trader"}')) {
  chrome = chrome.split(`<span className="block text-[10px] opacity-80">Hello, {firstName || "trader"}</span>
                <span className="block text-sm font-semibold">Account & Lists <ChevronDown className="inline size-3" /></span>`).join(`<span className="block text-[10px] opacity-80">Hello, {fullName}</span>
                <span className="block text-sm font-semibold">{role} · Account & Lists <ChevronDown className="inline size-3" /></span>`);
  changed = true;
}
if (changed) { fs.writeFileSync('src/components/site-chrome.tsx', chrome); console.log('DONE: name + role in header'); }
else console.log('WARNING: anchors not found');