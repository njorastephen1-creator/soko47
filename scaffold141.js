import fs from 'fs';
const f = 'src/routes/shop.$slug.tsx';
let c = fs.readFileSync(f, 'utf8');
const before = c;
c = c.split('        </div>\n      ))}').join('        </div>\n      )}');
if (c === before) console.log('NO MATCH');
else { fs.writeFileSync(f, c); console.log('FIXED: removed extra closing paren'); }