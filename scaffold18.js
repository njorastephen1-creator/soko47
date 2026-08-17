import fs from 'fs';
let markets = fs.readFileSync('src/data/markets.ts', 'utf8');
markets = markets.split('import { Leaf, Wheat, Beef, Fish, UtensilsCrossed, Armchair, Smartphone, Shirt, Hammer, Sparkles, Milk, Package } from "lucide-react";').join('import { Leaf, UtensilsCrossed, Armchair, Smartphone, Shirt, Hammer, Sparkles, Car, Baby, BookOpen, Sprout, Wrench, Dumbbell, Refrigerator, Gift, PawPrint } from "lucide-react";');
const catIdx = markets.indexOf('export type Category =');
if (catIdx > -1) {
  markets = markets.slice(0, catIdx) + `export type Category = { slug: string; name: string; icon: LucideIcon; subs: string[] };
export const CATEGORIES: Category[] = [
  { slug: "fresh-produce", name: "Fresh Produce & Groceries", icon: Leaf, subs: ["Vegetables", "Fruits", "Herbs & Spices", "Cereals & Grains", "Legumes", "Tubers", "Eggs", "Fresh Meat", "Poultry", "Fish & Seafood", "Dairy Products", "Cooking Ingredients", "Packaged Groceries"] },
  { slug: "fashion", name: "Fashion & Clothing", icon: Shirt, subs: ["Men's Clothing", "Women's Clothing", "Children's Clothing", "Shoes", "Bags", "Jewelry", "Watches", "Accessories", "Second-hand Clothes (Mitumba)"] },
  { slug: "electronics", name: "Electronics & Technology", icon: Smartphone, subs: ["Phones", "Smartphone Accessories", "Computers & Laptops", "TVs", "Audio Equipment", "Cameras", "Gaming", "Networking Equipment", "Chargers & Cables", "Power Banks", "Appliances"] },
  { slug: "furniture-home", name: "Furniture & Home", icon: Armchair, subs: ["Sofas", "Beds", "Mattresses", "Tables", "Chairs", "Cabinets", "Office Furniture", "Curtains", "Carpets & Rugs", "Home Decor"] },
  { slug: "kitchen", name: "Kitchen & Utensils", icon: UtensilsCrossed, subs: ["Cooking Pots", "Plates & Cups", "Cutlery", "Kitchen Appliances", "Storage Containers", "Gas Accessories", "Kitchen Tools"] },
  { slug: "hardware", name: "Construction & Hardware", icon: Hammer, subs: ["Building Materials", "Cement", "Timber", "Plumbing", "Electrical", "Paint", "Tools", "Ironmongery", "Roofing", "Security Hardware"] },
  { slug: "beauty", name: "Beauty & Personal Care", icon: Sparkles, subs: ["Cosmetics", "Hair Products", "Wigs & Extensions", "Perfumes", "Skincare", "Barber Supplies", "Salon Equipment"] },
  { slug: "automotive", name: "Automotive", icon: Car, subs: ["Car Parts", "Motorcycle Parts", "Tyres", "Batteries", "Oils & Lubricants", "Car Accessories", "Motorcycle Accessories", "Auto Tools"] },
  { slug: "baby-kids", name: "Baby & Kids", icon: Baby, subs: ["Baby Clothes", "Toys", "Baby Food", "Baby Care", "School Items", "Children's Accessories"] },
  { slug: "books-office", name: "Books, Stationery & Office", icon: BookOpen, subs: ["Books", "School Supplies", "Office Supplies", "Printing Materials", "Art Supplies", "Computer Accessories"] },
  { slug: "agriculture", name: "Agriculture & Farming", icon: Sprout, subs: ["Seeds", "Fertilizers", "Farm Tools", "Animal Feeds", "Poultry Equipment", "Irrigation Equipment", "Agrochemicals", "Greenhouse Supplies"] },
  { slug: "tools-machinery", name: "Tools & Machinery", icon: Wrench, subs: ["Power Tools", "Hand Tools", "Generators", "Welding Equipment", "Machinery", "Industrial Equipment"] },
  { slug: "sports", name: "Sports & Fitness", icon: Dumbbell, subs: ["Sportswear", "Football Equipment", "Gym Equipment", "Fitness Accessories", "Outdoor Equipment"] },
  { slug: "appliances", name: "Home Appliances", icon: Refrigerator, subs: ["Refrigerators", "Cookers", "Microwaves", "Washing Machines", "Fans", "Blenders", "Vacuum Cleaners"] },
  { slug: "gifts", name: "Gifts & Lifestyle", icon: Gift, subs: ["Gifts", "Flowers", "Decorations", "Party Supplies", "Religious Items", "Craft Items"] },
  { slug: "pets", name: "Pets & Animals", icon: PawPrint, subs: ["Pet Food", "Pet Accessories", "Animal Equipment", "Poultry Supplies"] }
];
const LEGACY: Record<string, string> = { vegetables: "Fresh Produce & Groceries", cereals: "Fresh Produce & Groceries", livestock: "Fresh Produce & Groceries", fish: "Fresh Produce & Groceries", dairy: "Fresh Produce & Groceries", utensils: "Kitchen & Utensils", furniture: "Furniture & Home", clothing: "Fashion & Clothing", hardware: "Construction & Hardware", beauty: "Beauty & Personal Care", other: "Other Goods" };
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? LEGACY[slug] ?? "Other Goods";
`;
  fs.writeFileSync('src/data/markets.ts', markets);
  console.log('Patched markets.ts (16 categories)');
} else console.log('WARNING: categories anchor not found');
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
let vChanged = false;
if (vendor.includes('const [form, setForm] = useState({ title: "", category_slug: CATEGORIES[0]!.slug,')) {
  vendor = vendor.split('const [form, setForm] = useState({ title: "", category_slug: CATEGORIES[0]!.slug, price_kes: "", unit: "piece", stock: "1", description: "", image_url: "" });').join('const [form, setForm] = useState({ title: "", category_slug: CATEGORIES[0]!.slug, subcategory: "", price_kes: "", unit: "piece", stock: "1", description: "", image_url: "" });');
  vendor = vendor.split('setForm({ title: "", category_slug: CATEGORIES[0]!.slug, price_kes: "", unit: "piece", stock: "1", description: "", image_url: "" });').join('setForm({ title: "", category_slug: CATEGORIES[0]!.slug, subcategory: "", price_kes: "", unit: "piece", stock: "1", description: "", image_url: "" });');
  vendor = vendor.split('onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>').join('onChange={(e) => setForm({ ...form, category_slug: e.target.value, subcategory: "" })}>');
  vendor = vendor.split('</select>\n            </div>\n            <div><Label htmlFor="p">').join('</select>\n            </div>\n            <div>\n              <Label htmlFor="cs">Sub-category</Label>\n              <select id="cs" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>\n                <option value="">Choose sub-category</option>\n                {(CATEGORIES.find((c) => c.slug === form.category_slug)?.subs || []).map((s) => (<option key={s} value={s}>{s}</option>))}\n              </select>\n            </div>\n            <div><Label htmlFor="p">');
  vendor = vendor.split('category_slug: form.category_slug, price_kes:').join('category_slug: form.category_slug, subcategory: form.subcategory || null, price_kes:');
  vChanged = true;
}
if (vChanged) { fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor); console.log('Patched vendor.tsx (sub-category select)'); } else console.log('WARNING: vendor patterns not found');
let browse = fs.readFileSync('src/routes/browse.tsx', 'utf8');
let bChanged = false;
if (!browse.includes('sub:')) {
  browse = browse.split('q: typeof search.q === "string" ? search.q : undefined').join('q: typeof search.q === "string" ? search.q : undefined,\n    sub: typeof search.sub === "string" ? search.sub : undefined');
  browse = browse.split('const { category, county, q } = Route.useSearch();').join('const { category, county, q, sub } = Route.useSearch();\n  const activeCat = CATEGORIES.find((c) => c.slug === category);');
  browse = browse.split('queryKey: ["browse", category, county, q],').join('queryKey: ["browse", category, county, q, sub],');
  browse = browse.split('if (category) query = query.eq("category_slug", category);').join('if (category) query = query.eq("category_slug", category);\n      if (sub) query = query.eq("subcategory", sub);');
  browse = browse.split('<div className="mt-4">\n        <select value={county ?? ""}').join('{activeCat && (\n        <div className="mt-3 flex flex-wrap gap-2">\n          <button onClick={() => setSearch({ sub: undefined })} className={"rounded-full border px-3 py-1 text-xs " + (!sub ? "bg-secondary text-foreground" : "border-border bg-card")}>All {activeCat.name}</button>\n          {activeCat.subs.map((s) => (\n            <button key={s} onClick={() => setSearch({ sub: s })} className={"rounded-full border px-3 py-1 text-xs " + (sub === s ? "bg-secondary text-foreground" : "border-border bg-card")}>{s}</button>\n          ))}\n        </div>\n      )}\n      <div className="mt-4">\n        <select value={county ?? ""}');
  bChanged = true;
}
if (bChanged) { fs.writeFileSync('src/routes/browse.tsx', browse); console.log('Patched browse.tsx (sub-category chips)'); } else console.log('WARNING: browse patterns not found');
let prod = fs.readFileSync('src/routes/product.$id.tsx', 'utf8');
if (prod.includes('{categoryName(product.category_slug)}</p>')) {
  prod = prod.split('<p className="text-sm text-muted-foreground">{categoryName(product.category_slug)}</p>').join('<p className="text-sm text-muted-foreground">{categoryName(product.category_slug)}{product.subcategory ? " · " + product.subcategory : ""}</p>');
  fs.writeFileSync('src/routes/product.$id.tsx', prod);
  console.log('Patched product.$id.tsx (show sub-category)');
}
console.log('DONE: 16 categories + subcategories');