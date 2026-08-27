import fs from 'fs';
const lines = fs.readFileSync('src/routes/index.tsx', 'utf8').split('\n');
console.log(lines.slice(14, 62).map((l, i) => (i + 15) + ' ' + l).join('\n'));