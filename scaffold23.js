import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
let changed = false;
const oldHeader = '<span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground text-primary"><Store className="size-5" /></span>';
if (chrome.includes(oldHeader)) {
  chrome = chrome.split(oldHeader).join('<span className="flex h-10 items-center justify-center rounded-xl bg-card px-2.5"><img src="/logo.png" alt="Soko47" className="h-7 w-auto" /></span>');
  changed = true;
}
const oldHeaderText = `<span className="leading-none">
            <span className="block font-display text-xl font-extrabold tracking-tight">Soko47</span>
            <svg viewBox="0 0 60 8" className="mt-0.5 h-1.5 w-14 text-accent" fill="none" aria-hidden="true"><path d="M2 2c18 6 38 6 56 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </span>`;
if (chrome.includes(oldHeaderText)) { chrome = chrome.split(oldHeaderText).join(''); changed = true; }
const oldFooter = '<span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store className="size-4" /></span>';
if (chrome.includes(oldFooter)) {
  chrome = chrome.split(oldFooter).join('<span className="flex h-9 items-center justify-center rounded-lg bg-card px-2"><img src="/logo.png" alt="Soko47" className="h-6 w-auto" /></span>');
  changed = true;
}
if (changed) { fs.writeFileSync('src/components/site-chrome.tsx', chrome); console.log('Patched site-chrome.tsx (your logo)'); }
else console.log('WARNING: logo anchors not found');
console.log('DONE: logo wired');