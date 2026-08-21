import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
if (c.includes('className="absolute -top-2 rounded-full bg-white p-1 shadow " + (m.sender_id')) {
  c = c.split('className="absolute -top-2 rounded-full bg-white p-1 shadow " + (m.sender_id === session.user.id ? "-left-2" : "-right-2")').join('className={"absolute -top-2 rounded-full bg-white p-1 shadow " + (m.sender_id === session.user.id ? "-left-2" : "-right-2")}');
  fs.writeFileSync(f, c);
  console.log('FIXED: className braces');
} else console.log('pattern not found');