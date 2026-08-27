import fs from 'fs';

console.log('=== FULL VIDEO UPLOAD ===');
console.log(fs.readFileSync('src/components/video-upload.tsx', 'utf8'));

console.log('\n=== CHAT UPLOAD (first 2000 chars) ===');
const chatFile = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
const chat = fs.readFileSync(chatFile, 'utf8');
const uploadStart = chat.indexOf('supabase.storage');
if (uploadStart > -1) {
  console.log(chat.slice(Math.max(0, uploadStart - 500), uploadStart + 1500));
}

console.log('\n=== ENRICH UPLOAD SECTIONS ===');
const enrich = fs.readFileSync('src/routes/_authenticated/enrich.$id.tsx', 'utf8');
const lines = enrich.split('\n');
lines.forEach((l, i) => {
  if (l.includes('supabase.storage') || l.includes('upload(') || l.includes('pickVideo')) {
    console.log(i, lines.slice(Math.max(0, i-2), i+5).join('\n'));
    console.log('---');
  }
});