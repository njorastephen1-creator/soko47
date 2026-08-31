import fs from 'fs';
const chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
console.log('=== FOOTER SECTION ===');
console.log(chrome.substring(chrome.indexOf('<footer')));
console.log('\n=== AUTH PAGE ===');
console.log(fs.readFileSync('src/routes/auth.tsx', 'utf8'));