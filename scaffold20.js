import fs from 'fs';
let css = fs.readFileSync('src/styles.css', 'utf8');
css = css.split('h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.02em; color: var(--color-foreground); }').join('h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.02em; }');
fs.writeFileSync('src/styles.css', css);
console.log('DONE: hero heading fixed');