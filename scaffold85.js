import fs from 'fs';
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (vendor.includes('Customer money goes straight to YOU - Soko47 never touches it.') && !vendor.includes('How to get your key')) {
  vendor = vendor.split('<p className="mt-1 text-sm text-muted-foreground">Customer money goes straight to YOU - Soko47 never touches it.</p>').join('<p className="mt-1 text-sm text-muted-foreground">Customer money goes straight to YOU - Soko47 never touches it.</p>\n        <p className="mt-1 text-xs text-muted-foreground">How to get your key: create a FREE account at payment.intasend.com → verify → Integrations → API Keys → copy your ISPubKey_live_... and paste it above. Buyers then get automatic M-Pesa prompts and money lands in YOUR account.</p>');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('DONE: helper text added');
} else console.log('already there or not found');