import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
const oldLogo = '<span className="flex h-10 items-center justify-center rounded-xl bg-card px-2.5"><img src="/logo.png" alt="Soko47" className="h-7 w-auto" /></span>';
const newLogo = '<span className="flex h-12 items-center justify-center rounded-xl bg-card px-3"><img src="/logo.png" alt="Soko47" className="h-10 w-auto" /></span>';
if (chrome.includes(oldLogo)) {
  chrome = chrome.split(oldLogo).join(newLogo);
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('DONE: logo bigger');
} else console.log('WARNING: logo not found');