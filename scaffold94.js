import fs from 'fs';
const f = 'src/routes/_authenticated/chat.$vendorId.$buyerId.tsx';
let c = fs.readFileSync(f, 'utf8');
if (c.includes('-right-2")}>>')) {
  c = c.split('-right-2")}>>').join('-right-2")}>');
  fs.writeFileSync(f, c);
  console.log('FIXED: removed extra brace');
} else if (c.includes('-right-2")}}>')) {
  c = c.split('-right-2")}>>').join('-right-2")}>');
  c = c.split('-right-2")}>').join('-right-2")}>');
  // Find the exact line and fix double }}
  const lines = c.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className={"absolute -top-2') && lines[i].includes('}}')) {
      lines[i] = lines[i].replace(/"\}\}>, '"}>');
      lines[i] = lines[i].replace(/\}\}>, '}>>'); // safety
      lines[i] = lines[i].replace(/"\}\}>, '"}>');
      // Simple targeted fix
      lines[i] = lines[i].replace('"}>>', ')}>');
    }
  }
  c = lines.join('\n');
  fs.writeFileSync(f, c);
  console.log('FIXED via line scan');
} else {
  // Nuclear option - rewrite the specific line
  c = c.replace(/className=\{"absolute -top-2 rounded-full bg-white p-1 shadow " \+ \(m\.sender_id === session\.user\.id \? "-left-2" : "-right-2"\)\}\}>/g,
                'className={"absolute -top-2 rounded-full bg-white p-1 shadow " + (m.sender_id === session.user.id ? "-left-2" : "-right-2")}>');
  fs.writeFileSync(f, c);
  console.log('FIXED via regex');
}