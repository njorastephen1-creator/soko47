import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (chrome.includes('md:hidden search row')) { console.log('already present'); process.exit(0); }
const handler = (chrome.match(/onSubmit=\{(\w+)\}/) || [])[1] || 'go';
const vname = (chrome.match(/<input[^>]*value=\{(\w+)\}/) || [])[1] || 'q';
const setter = (chrome.match(/onChange=\{\(e\) => (\w+)\(e\.target\.value\)/) || [])[1] || 'setQ';
const marker = 'All goods</Link>';
const idx = chrome.indexOf(marker);
if (idx === -1) { console.log('WARNING: All goods not found'); process.exit(0); }
const navIdx = chrome.lastIndexOf('<nav', idx);
if (navIdx === -1) { console.log('WARNING: nav not found'); process.exit(0); }
const mobileSearch = `<div className="border-t border-black/10 bg-primary px-4 py-2 md:hidden">
        <form onSubmit={${handler}} className="flex overflow-hidden rounded-lg bg-white">
          <input value={${vname}} onChange={(e) => ${setter}(e.target.value)} placeholder="Search sufuria, sofa, tomatoes..." className="min-w-0 flex-1 px-3 py-2 text-sm text-foreground outline-none" />
          <button className="bg-accent px-4" aria-label="Search"><Search className="size-4 text-foreground" /></button>
        </form>
      </div>
      {/* md:hidden search row */}
`;
chrome = chrome.slice(0, navIdx) + mobileSearch + chrome.slice(navIdx);
fs.writeFileSync('src/components/site-chrome.tsx', chrome);
console.log('DONE: mobile search row');