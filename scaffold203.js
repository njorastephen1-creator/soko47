import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');

const OLD = '["importexport", "Import & Export"]';
const NEW = '["importexport", "Import & Export"], ["clearing", "Clearing & Forwarding"], ["logistics", "Logistics & Courier"]';

if (!c.includes(OLD)) {
  console.log('Anchor not found');
  process.exit(1);
}

c = c.split(OLD).join(NEW);
fs.writeFileSync(f, c);
console.log('DONE: Clearing & Forwarding + Logistics added');