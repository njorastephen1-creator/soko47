import fs from 'fs';

// Read current file
let c = fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8');

// Fix the typo
c = c.replace(/};n  const remove/g, '};\n  const remove');

fs.writeFileSync('src/routes/_authenticated/orders.tsx', c);
console.log('typo fixed');