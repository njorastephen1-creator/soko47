import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
let n = 0;
const swaps = [
  ['<footer className="mt-16 bg-primary-deep text-primary-foreground">', '<footer className="mt-16 bg-primary text-primary-foreground">'],
  ['<nav className="bg-primary-deep text-sm">', '<nav className="bg-black/10 text-sm">'],
  ['hover:bg-primary-deep', 'hover:bg-black/10'],
  ['className="block w-full bg-primary py-3 text-center text-sm font-medium hover:bg-primary-deep"', 'className="block w-full bg-black/10 py-3 text-center text-sm font-medium hover:bg-black/20"']
];
for (const [oldS, newS] of swaps) {
  if (chrome.includes(oldS)) { chrome = chrome.split(oldS).join(newS); n++; }
}
if (n > 0) { fs.writeFileSync('src/components/site-chrome.tsx', chrome); console.log('DONE:', n, 'swaps - footer visible again'); }
else console.log('WARNING: nothing matched');