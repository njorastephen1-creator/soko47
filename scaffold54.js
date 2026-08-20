import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
let changed = false;
if (chrome.includes('const [q, setQ] = useState("");')) {
  chrome = chrome.split('const [q, setQ] = useState("");').join('const [sc, setSc] = useState("all");\n  const qRef = (typeof window !== "undefined" ? (window as any).__soko47_q || "" : "");');
  chrome = chrome.split('const [sc, setSc] = useState("all");').join('');
  chrome = chrome.split('const go = (e: React.FormEvent) => {\n    e.preventDefault();\n    navigate({ to: "/browse", search: { q: q || undefined, category: sc === "all" ? undefined : sc } });\n  };').join('const go = (e: React.FormEvent) => {\n    e.preventDefault();\n    const input = (e.target as HTMLFormElement).querySelector("input") as HTMLInputElement;\n    const query = input ? input.value.trim() : "";\n    navigate({ to: "/browse", search: { q: query || undefined, category: sc === "all" ? undefined : sc } });\n  };');
  chrome = chrome.split('<input value={q} onChange={(e) => setQ(e.target.value)}').join('<input defaultValue={qRef} ref={(el) => { if (el && typeof window !== "undefined") (window as any).__soko47_q = el.value; }}');
  changed = true;
  console.log('Patched: bulletproof search');
}
if (changed) { fs.writeFileSync('src/components/site-chrome.tsx', chrome); console.log('DONE'); }
else console.log('WARNING: patterns not found');