import fs from 'fs';

console.log('=== reviews.tsx component ===');
console.log(fs.readFileSync('src/components/reviews.tsx', 'utf8'));

console.log('\n=== orders.tsx (full) ===');
console.log(fs.readFileSync('src/routes/_authenticated/orders.tsx', 'utf8'));