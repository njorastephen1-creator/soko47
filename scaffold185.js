import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');
if (c.includes('phone: vendor ? vendor.phone : "",')) {
  c = c.split('phone: vendor ? vendor.phone : "",').join('phone: (vendor && vendor.phone) || "",');
  fs.writeFileSync(f, c);
  console.log('phone fallback fixed');
} else if (!c.includes('phone: (vendor && vendor.phone)')) {
  c = c.split('      status: "trial",').join('      phone: (vendor && vendor.phone) || "",\n      status: "trial",');
  fs.writeFileSync(f, c);
  console.log('phone inserted with fallback');
} else console.log('already good');