import fs from 'fs';

console.log('=== use-is-admin.ts ===');
console.log(fs.readFileSync('src/lib/use-is-admin.ts', 'utf8'));

console.log('\n=== admin.tsx: admin-management + isAdm sections ===');
const a = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
const lines = a.split('\n');
lines.forEach((l, i) => {
  if (/isAdm|addAdmin|newAdmin|admins|useIsAdmin|is_admin|njorastephen/.test(l)) {
    console.log(i, l.trim().slice(0, 200));
  }
});