import fs from 'fs';
const c = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
const i = c.indexOf('const isVid');
console.log(c.slice(i > -1 ? i : c.indexOf('const gallery'), c.indexOf('About this item')));