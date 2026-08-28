import fs from 'fs';
const c = fs.readFileSync('src/components/product-card.tsx', 'utf8');
console.log(c);