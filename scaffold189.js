import fs from 'fs';
const f = 'src/routes/_authenticated/vendor.tsx';
let c = fs.readFileSync(f, 'utf8');

// states
if (!c.includes('const [prodPage, setProdPage]')) {
  c = c.split('const [prodSearch, setProdSearch] = useState("");').join('const [prodSearch, setProdSearch] = useState("");\n  const [prodPage, setProdPage] = useState(0);\n  const [prodCat, setProdCat] = useState("all");');
}

// category filter + paginated list (IIFE)
const old2 = `          ))}
        </div>
        <div className="mt-3 space-y-2">
          {(products || []).filter((p: any) => (prodFilter === "all" ? true : prodFilter === "active" ? p.is_active : !p.is_active)).filter((p: any) => p.title.toLowerCase().includes(prodSearch.toLowerCase())).map((p: any) => (`;
const new2 = `          ))}
          <select value={prodCat} onChange={(e) => { setProdCat(e.target.value); setProdPage(0); }} className="rounded-full border border-border bg-card px-2 py-1 text-xs font-semibold">
            <option value="all">All categories</option>
            {Array.from(new Set((products || []).map((pp: any) => pp.category_slug).filter(Boolean))).map((cc: any) => (<option key={cc} value={cc}>{cc}</option>))}
          </select>
        </div>
        {(() => {
          const filtered = (products || []).filter((p: any) => (prodFilter === "all" ? true : prodFilter === "active" ? p.is_active : !p.is_active)).filter((p: any) => p.title.toLowerCase().includes(prodSearch.toLowerCase())).filter((p: any) => (prodCat === "all" ? true : p.category_slug === prodCat));
          const pages = Math.max(0, Math.ceil(filtered.length / 10) - 1);
          const page = Math.min(prodPage, pages);
          const slice = filtered.slice(page * 10, page * 10 + 10);
          return (<>
        <div className="mt-3 space-y-2">
          {slice.map((p: any) => (`;
if (c.includes(old2)) c = c.split(old2).join(new2); else console.log('old2 not matched');

const old3 = `          ))}
          {(products || []).length === 0 && <p className="text-sm text-muted-foreground">No products yet - add your first one.</p>}
        </div>`;
const new3 = `          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No products match - adjust your filters.</p>}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
          <button disabled={page === 0} onClick={() => setProdPage(page - 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Previous</button>
          <span>{filtered.length} products · page {page + 1} of {pages + 1}</span>
          <button disabled={page >= pages} onClick={() => setProdPage(page + 1)} className="rounded-full bg-secondary px-3 py-1 disabled:opacity-40">Next</button>
        </div>
          </>);
        })()}`;
if (c.includes(old3)) c = c.split(old3).join(new3); else console.log('old3 not matched');

fs.writeFileSync(f, c);
console.log('DONE: products pagination + category filter');