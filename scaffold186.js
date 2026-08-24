import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');

// admin flag inside openShop
if (!c.includes('const adm = !!(session && session.user.email === "njorastephen1@gmail.com");')) {
  c = c.split('    const name = newShop.trim();').join('    const name = newShop.trim();\n    const adm = !!(session && session.user.email === "njorastephen1@gmail.com");');
}

// trial logic: admin unrestricted, existing client +1wk, new customer +3wks
c = c.split('      status: "trial",\n      subscription_plan: "starter",\n      subscription_expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),').join('      status: adm ? "active" : "trial",\n      subscription_plan: adm ? "pro" : "starter",\n      subscription_expires_at: adm ? null : new Date(Date.now() + (vendor ? 7 : 21) * 864e5).toISOString(),');

fs.writeFileSync(f, c);
console.log('DONE: multi-shop + tiered trials');