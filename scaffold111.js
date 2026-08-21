import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
if (c.includes('buyerProf.display_name ? buyerProf.display_name : "Customer"')) {
  c = c.split('buyerProf.display_name ? buyerProf.display_name : "Customer"').join('buyerProf.display_name ? buyerProf.display_name : (((msgs || []).find((m: any) => m.sender_id !== myId) || {}).sender_name || "Customer")');
  fs.writeFileSync(f, c);
  console.log('DONE: buyer name falls back to their order/message name');
} else console.log('pattern not found');