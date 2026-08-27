import fs from 'fs';
const c = fs.readFileSync('api/og.js', 'utf8');
console.log('=== Lines 1-30 of api/og.js ===');
console.log(c.split('\n').slice(0, 30).map((l, i) => (i + 1) + ' ' + l).join('\n'));

console.log('\n=== Does debug branch exist? ===');
console.log(c.includes('req.query.debug'));