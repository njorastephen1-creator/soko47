import fs from 'fs';
let index = fs.readFileSync('src/routes/index.tsx', 'utf8');
let changed = false;
if (index.includes('fresh.some((p)')) {
  index = index.split('fresh.some((p)').join('(fresh || []).some((p)');
  changed = true;
}
if (index.includes('fresh.filter((p)')) {
  index = index.split('fresh.filter((p)').join('(fresh || []).filter((p)');
  changed = true;
}
if (changed) { fs.writeFileSync('src/routes/index.tsx', index); console.log('DONE: safe fresh fallback'); }
else console.log('WARNING: patterns not found');