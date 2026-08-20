import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
if (!chrome.includes('topsearch-mobile-hidden')) {
  const replaced = chrome.replace(/<form onSubmit=\{\w+\} className="/, (m) => m + 'hidden md:flex ');
  if (replaced !== chrome) {
    chrome = replaced.split('{/* md:hidden search row */}').join('{/* md:hidden search row */}{/* topsearch-mobile-hidden */}');
    fs.writeFileSync('src/components/site-chrome.tsx', chrome);
    console.log('Patched: small top search hidden on mobile');
  } else console.log('WARNING: top form not found');
} else console.log('top search already hidden');
let index = fs.readFileSync('src/routes/index.tsx', 'utf8');
index = index.replace('.limit(12)', '.limit(60)');
if (!index.includes('CATEGORIES')) {
  index = index.replace(/import \{ ([^}]*) \} from "@\/data\/markets";/, (m, names) => 'import { CATEGORIES, ' + names.trim() + ' } from "@/data/markets";');
  console.log('Added CATEGORIES import');
}
const fm = index.match(/const \{ data: (\w+) \} = useQuery\(\{[\s\S]{0,120}?"fresh"/);
const freshName = fm ? fm[1] : 'fresh';
console.log('fresh variable:', freshName);
const marker = 'Fresh listings';
const mi = index.indexOf(marker);
if (mi > -1) {
  const secStart = index.lastIndexOf('<section', mi);
  const secEnd = index.indexOf('</section>', mi);
  if (secStart > -1 && secEnd > -1) {
    const newSection = `<section className="mx-auto max-w-7xl px-4 py-4">
        <h2 className="font-display text-2xl font-bold">Fresh listings</h2>
        {CATEGORIES.filter((c) => ${freshName}.some((p) => p.category_slug === c.slug)).map((c) => (
          <div key={c.slug} className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{c.name}</h3>
              <Link to="/browse" search={{ category: c.slug }} className="text-xs font-medium text-accent-deep hover:underline">View all</Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {${freshName}.filter((p) => p.category_slug === c.slug).slice(0, 6).map((p) => (<ProductCard key={p.id} product={p} />))}
            </div>
          </div>
        ))}
      </section>`;
    index = index.slice(0, secStart) + newSection + index.slice(secEnd + '</section>'.length);
    fs.writeFileSync('src/routes/index.tsx', index);
    console.log('Patched: categorized homepage sections');
  } else console.log('WARNING: section bounds not found');
} else console.log('WARNING: Fresh listings not found');
console.log('DONE: clean mobile + categorized home');