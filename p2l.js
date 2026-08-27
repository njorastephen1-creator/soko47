import fs from 'fs';
import path from 'path';

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

// Check what upload mechanisms are actually used
console.log('=== UPLOAD MECHANISMS IN USE ===\n');

for (const f of walk('src')) {
  if (!/\.(tsx|ts)$/.test(f)) continue;
  const c = fs.readFileSync(f, 'utf8');
  
  if (c.includes('supabase.storage')) {
    console.log('SUPABASE STORAGE:', f);
  }
  if (c.includes('/api/r2-presign')) {
    console.log('R2 PRESIGN:', f);
  }
  if (c.includes('upload(') && !c.includes('supabase.storage')) {
    console.log('OTHER UPLOAD:', f);
  }
}

// Print the video-upload and image-upload components
console.log('\n=== VIDEO UPLOAD COMPONENT ===');
const vidFile = 'src/components/video-upload.tsx';
if (fs.existsSync(vidFile)) {
  console.log(fs.readFileSync(vidFile, 'utf8').slice(0, 2000));
}

console.log('\n=== IMAGE UPLOAD COMPONENT ===');
const imgFile = 'src/components/image-upload.tsx';
if (fs.existsSync(imgFile)) {
  console.log(fs.readFileSync(imgFile, 'utf8').slice(0, 2000));
}