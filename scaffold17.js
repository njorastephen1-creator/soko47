import fs from 'fs';
for (const f of ['src/routes/auth.tsx', 'src/routes/_authenticated/account.tsx']) {
  let code = fs.readFileSync(f, 'utf8');
  const before = code;
  code = code.split('Karibu back').join('Welcome back');
  code = code.split('Karibu, {name}').join('Welcome, {name}');
  if (code !== before) { fs.writeFileSync(f, code); console.log('Updated', f); }
  else console.log('No changes in', f);
}
console.log('DONE: welcome back');