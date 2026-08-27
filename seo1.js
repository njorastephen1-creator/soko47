import fs from 'fs';
const c = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
console.log('First 100 lines of product page (checking current meta tags):');
console.log(c.split('\n').slice(0, 100).map((l, i) => i + ' ' + l).join('\n'));