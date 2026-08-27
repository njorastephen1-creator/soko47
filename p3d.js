import fs from 'fs';
const c = fs.readFileSync('src/routes/_authenticated/admin.tsx', 'utf8');
console.log('isOwner references:');
c.split('\n').forEach((l, i) => {
  if (/isOwner|isAdminEmail|admin\.ts/.test(l)) console.log(i, l.trim().slice(0, 200));
});