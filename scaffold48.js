import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
let changed = false;
const r1 = chrome.replace(/onSubmit=\{\w+\} className="hidden md:flex /, (m) => m.replace('hidden md:flex ', ''));
if (r1 !== chrome) { chrome = r1; changed = true; console.log('top search now always visible'); }
const startMarker = '<div className="border-t border-black/10 bg-primary px-4 py-2 md:hidden">';
const endMarker = '{/* md:hidden search row */}';
const si = chrome.indexOf(startMarker);
const ei = chrome.indexOf(endMarker);
if (si > -1 && ei > -1) {
  chrome = chrome.slice(0, si) + chrome.slice(ei + endMarker.length);
  changed = true; console.log('removed duplicate mobile search row');
}
if (chrome.includes('<DropdownMenuTrigger className="rounded-md px-2 py-1 text-left hover:bg-primary">')) {
  chrome = chrome.split('<DropdownMenuTrigger className="rounded-md px-2 py-1 text-left hover:bg-primary">').join('<DropdownMenuTrigger className="hidden rounded-md px-2 py-1 text-left hover:bg-primary md:block">');
  changed = true; console.log('account text hidden on mobile');
}
if (chrome.includes('<Link to="/orders" className="rounded-md px-2 py-1 hover:bg-primary">')) {
  chrome = chrome.split('<Link to="/orders" className="rounded-md px-2 py-1 hover:bg-primary">').join('<Link to="/orders" className="hidden rounded-md px-2 py-1 hover:bg-primary md:block">');
  changed = true; console.log('orders text hidden on mobile');
}
if (changed) { fs.writeFileSync('src/components/site-chrome.tsx', chrome); console.log('DONE: amazon-style header'); }
else console.log('WARNING: nothing changed');