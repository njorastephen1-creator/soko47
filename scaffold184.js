import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('phone: vendor ? vendor.phone')) {
  c = c.split('      market: vendor ? vendor.market : "Online",\n      status: "trial",').join('      market: vendor ? vendor.market : "Online",\n      phone: vendor ? vendor.phone : "",\n      pay_phone: vendor ? vendor.pay_phone : null,\n      status: "trial",');
  fs.writeFileSync(f, c);
  console.log('openShop: phone included');
} else console.log('already present');