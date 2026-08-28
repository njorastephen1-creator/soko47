import fs from 'fs';
let c = fs.readFileSync('src/routes/shop.$slug.tsx', 'utf8');

const OLD = `      {shop.status !== "blocked" && subscriptionActive && (
        <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
        {!!products && products.length === page * 60 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-accent bg-accent px-8 py-3 font-semibold text-foreground hover:bg-accent-deep"
            >
              Load more
            </button>
          </div>
        )}
      )}`;

const NEW = `      {shop.status !== "blocked" && subscriptionActive && (
        <>
          <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {(products || []).map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>
          {!!products && products.length === page * 60 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-accent bg-accent px-8 py-3 font-semibold text-foreground hover:bg-accent-deep"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}`;

if (!c.includes(OLD)) { console.log('pattern not found'); process.exit(1); }
c = c.split(OLD).join(NEW);
fs.writeFileSync('src/routes/shop.$slug.tsx', c);
console.log('JSX wrapped in fragment');