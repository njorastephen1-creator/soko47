import fs from 'fs';
let c = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1) Add trending query inside Home()
const OLD_QUERY = 'function Home() {\n  const { data: fresh } = useQuery({';
const NEW_QUERY = `function Home() {
  const { data: trending } = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors!inner(shop_name, slug, county_slug, market_name, status, rating_sum, rating_count)").eq("vendors.status", "active").gt("likes_count", 0).order("likes_count", { ascending: false }).order("created_at", { ascending: false }).limit(10);
      return data as ProductRow[];
    },
  });
  const { data: fresh } = useQuery({`;
if (!c.includes(OLD_QUERY)) { console.log('query anchor not found'); process.exit(1); }
c = c.split(OLD_QUERY).join(NEW_QUERY);
console.log('trending query added');

// 2) Add trending rail before Fresh listings
const OLD_SECTION = '      <section className="mx-auto max-w-7xl px-4 py-4">\n        <h2 className="font-display text-2xl font-bold">Fresh listings</h2>';
const NEW_SECTION = `      {(trending || []).length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">🔥 Trending this week</h2>
            <Link to="/browse" className="text-xs font-medium text-accent-deep hover:underline">View all</Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">What Kenya is liking right now</p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {(trending || []).map((p) => (
              <div key={p.id} className="w-40 shrink-0 sm:w-48"><ProductCard product={p} /></div>
            ))}
          </div>
        </section>
      )}
` + OLD_SECTION;
if (!c.includes(OLD_SECTION)) { console.log('section anchor not found'); process.exit(1); }
c = c.split(OLD_SECTION).join(NEW_SECTION);
console.log('trending rail added');

fs.writeFileSync('src/routes/index.tsx', c);
console.log('\nhome page updated');