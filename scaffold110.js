import fs from 'fs';
const files = [
  'src/routes/_authenticated/profile.tsx',
  'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx',
];
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('MISSING:', f); continue; }
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  c = c.replaceAll('.from("profiles")', '.from("user_profiles")');
  if (c === before) console.log('NO CHANGE:', f);
  else { fs.writeFileSync(f, c); console.log('PATCHED:', f); }
}
console.log('DONE');