import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
const before = c;
c = c.split(': "Long-press / right-click a message"))}</p>').join(': "Long-press / right-click a message")))}</p>');
if (c === before) console.log('NO MATCH - pattern not found');
else { fs.writeFileSync(f, c); console.log('FIXED: added missing closing parenthesis'); }