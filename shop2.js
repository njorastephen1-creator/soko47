import fs from 'fs';
let c = fs.readFileSync('src/routes/shop.$slug.tsx', 'utf8');

// 1) Add react import if missing
if (!c.includes('from "react"')) {
  c = c.split('import { useQuery } from "@tanstack/react-query";').join('import { useEffect, useState } from "react";\nimport { useQuery } from "@tanstack/react-query";');
  console.log('react import added');
}

// 2) Add page state + reset when shop changes
const OLD_STATE = 'const { data: shop } = useQuery({';
const NEW_STATE = 'const [page, setPage] = useState(1);\n  useEffect(() => { setPage(1); }, [shop ? shop.id : ""]);\n  const { data: shop } = useQuery({';
if (!c.includes(OLD_STATE)) { console.log('state anchor not found'); process.exit(1); }
c = c.split(OLD_STATE).join(NEW_STATE);
console.log('page state added');

// 3) Include page in queryKey
const OLD_KEY = 'queryKey: ["shop-products", shop ? shop.id : ""],';
const NEW_KEY = 'queryKey: ["shop-products", shop ? shop.id : "", page],';
if (!c.includes(OLD_KEY)) { console.log('queryKey anchor not found'); process.exit(1); }
c = c.split(OLD_KEY).join(NEW_KEY);
console.log('queryKey updated');

// 4) Expand limit to page * 60
const OLD_LIMIT = '.order("created_at", { ascending: false }).limit(60);';
const NEW_LIMIT = '.order("created_at", { ascending: false }).limit(page * 60);';
if (!c.includes(OLD_LIMIT)) { console.log('limit anchor not found'); process.exit(1); }
c = c.split(OLD_LIMIT).join(NEW_LIMIT);
console.log('limit updated');

// 5) Add Load more button after the grid
const OLD_GRID = '          {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}\n        </div>\n      )}';
const NEW_GRID = '          {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}\n        </div>\n        {!!products && products.length === page * 60 && (\n          <div className="mt-8 text-center">\n            <button\n              onClick={() => setPage((p) => p + 1)}\n              className="rounded-full border border-accent bg-accent px-8 py-3 font-semibold text-foreground hover:bg-accent-deep"\n            >\n              Load more\n            </button>\n          </div>\n        )}\n      )}';
if (!c.includes(OLD_GRID)) { console.log('grid anchor not found'); process.exit(1); }
c = c.split(OLD_GRID).join(NEW_GRID);
console.log('Load more button added');

fs.writeFileSync('src/routes/shop.$slug.tsx', c);
console.log('\nshop page updated');