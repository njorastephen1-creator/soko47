import fs from 'fs';
for (const f of ['src/routes/index.tsx', 'src/routes/browse.tsx']) {
  console.log('===== ' + f + ' =====');
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split('\n');
  lines.forEach((l, i) => {
    if (/from\("|\.limit\(|\.order\(|\.range\(|\.select\(/.test(l)) console.log(i, l.trim().slice(0, 220));
  });
}