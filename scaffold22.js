import fs from 'fs';
let css = fs.readFileSync('src/styles.css', 'utf8');
css = css.split('--gradient-hero: linear-gradient(135deg, #055A35 0%, #087443 55%, #0A8A4F 100%);').join('--gradient-hero: radial-gradient(55rem 26rem at 88% 12%, rgb(224 179 58 / 0.16), transparent 60%), radial-gradient(45rem 24rem at 0% 100%, rgb(10 138 79 / 0.45), transparent 65%), linear-gradient(140deg, #141D18 0%, #0A3B28 55%, #087443 115%);');
fs.writeFileSync('src/styles.css', css);
console.log('Patched styles.css (premium hero gradient)');
let index = fs.readFileSync('src/routes/index.tsx', 'utf8');
if (index.includes('Kenya\'s great markets, now open online.')) {
  index = index.split('Kenya\'s great markets, now open online.').join('Kenya\'s great markets, <span className="text-accent">now open online.</span>');
  fs.writeFileSync('src/routes/index.tsx', index);
  console.log('Patched index.tsx (gold highlight)');
}
console.log('DONE: hero upgrade');