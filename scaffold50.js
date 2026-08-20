import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
let changed = false;
if (chrome.includes('export function Header()')) {
  chrome = chrome.split('export function Header()').join('export function SiteHeader()');
  changed = true;
}
if (chrome.includes('export function Footer()')) {
  chrome = chrome.split('export function Footer()').join('export function SiteFooter()');
  changed = true;
}
if (changed) { fs.writeFileSync('src/components/site-chrome.tsx', chrome); console.log('DONE: export names fixed'); }
else console.log('WARNING: names not found');