import fs from 'fs';
import path from 'path';
const files = {
'src/data/markets.ts': `import type { LucideIcon } from "lucide-react";
import { Leaf, Wheat, Beef, Fish, UtensilsCrossed, Armchair, Smartphone, Shirt, Hammer, Sparkles, Milk, Package } from "lucide-react";
export type CountyMarkets = { county: string; slug: string; general: string; maliMali: string; produce: string; produceNote: string };
export const COUNTIES: CountyMarkets[] = [
  { county: "Baringo", slug: "baringo", general: "Marigat Market", maliMali: "Kabarnet CBD Mali Mali Shops", produce: "Marigat Market", produceNote: "Watermelons, tomatoes and goats" },
  { county: "Bomet", slug: "bomet", general: "Sotik Open-Air Market", maliMali: "Bomet Mulot Line Shops", produce: "Sotik Market", produceNote: "Milk, vegetables, sweet potatoes" },
  { county: "Bungoma", slug: "bungoma", general: "Webuye / Chwele Market", maliMali: "Bungoma Municipal Market", produce: "Chwele Market", produceNote: "Onions, maize and poultry" },
  { county: "Busia", slug: "busia", general: "Busia Border Market", maliMali: "Busia Border Custom Stalls", produce: "Malaba / Busia Market", produceNote: "Cereals, fish, cross-border produce" },
  { county: "Elgeyo-Marakwet", slug: "elgeyo-marakwet", general: "Iten Market", maliMali: "Iten Town Lower Stalls", produce: "Iten Market", produceNote: "Potatoes, passion fruit, honey" },
  { county: "Embu", slug: "embu", general: "Ishiara Market", maliMali: "Embu Caltex Wholesalers", produce: "Manyatta / Ishiara Markets", produceNote: "Avocados, mangoes, maize" },
  { county: "Garissa", slug: "garissa", general: "Garissa Livestock Market", maliMali: "Suq Mugdi", produce: "Garissa Suq", produceNote: "Livestock, tomatoes, mangoes" },
  { county: "Homa Bay", slug: "homa-bay", general: "Homa Bay Pier Market", maliMali: "Homa Bay Pier Wholesale Stalls", produce: "Homa Bay Pier Market", produceNote: "Fish, sweet potatoes, sorghum" },
  { county: "Isiolo", slug: "isiolo", general: "Isiolo Central Market", maliMali: "Isiolo Main Market", produce: "Isiolo Central Market", produceNote: "Livestock, onions, dry-land produce" },
  { county: "Kajiado", slug: "kajiado", general: "Isinya / Kajiado Town Market", maliMali: "Kitengela Mali Mali Lane", produce: "Kitengela / Ilbisil Markets", produceNote: "Beef and greenhouse vegetables" },
  { county: "Kakamega", slug: "kakamega", general: "Kakamega Municipal Market", maliMali: "Kakamega Main Market Lower Section", produce: "Lubao Market", produceNote: "Livestock and farm produce" },
  { county: "Kericho", slug: "kericho", general: "Kericho Green Square Market", maliMali: "Kericho Behind the Stage shops", produce: "Brooke / Kericho Main Market", produceNote: "Tea-zone vegetables, potatoes" },
  { county: "Kiambu", slug: "kiambu", general: "Thika Municipal Market", maliMali: "Thika Commercial Street", produce: "Wangige Market", produceNote: "Poultry, eggs, vegetables" },
  { county: "Kilifi", slug: "kilifi", general: "Ganze / Mtwapa Markets", maliMali: "Mtwapa Posta Line", produce: "Mtwapa / Charo Wa Mae", produceNote: "Coconuts, cashews, mangoes" },
  { county: "Kirinyaga", slug: "kirinyaga", general: "Kianyaga / Sagana Markets", maliMali: "Kerugoya Stadium Road", produce: "Wang'uru (Mwea) Market", produceNote: "Pishori rice and tomatoes" },
  { county: "Kisii", slug: "kisii", general: "Kisii Daraja Mbili Market", maliMali: "Daraja Mbili Upper Section", produce: "Daraja Mbili Market", produceNote: "Bananas, sweet potatoes" },
  { county: "Kisumu", slug: "kisumu", general: "Kibuye Market", maliMali: "Kibuye Mali Mali section", produce: "Kibuye Market", produceNote: "Fish and fresh food wholesale" },
  { county: "Kitui", slug: "kitui", general: "Kitui Mulango / Migwani", maliMali: "Kitui Kalundu Market", produce: "Kalundu Market", produceNote: "Ndengu, sorghum, pigeon peas" },
  { county: "Kwale", slug: "kwale", general: "Ukunda / Msambweni Markets", maliMali: "Ukunda Stage Mali Mali shops", produce: "Ukunda / Kwale Town Markets", produceNote: "Citrus, passion fruit, seafood" },
  { county: "Laikipia", slug: "laikipia", general: "Nanyuki Open-Air Market", maliMali: "Nanyuki Central Lower Section", produce: "Nanyuki Open-Air Market", produceNote: "Highland vegetables, beef" },
  { county: "Lamu", slug: "lamu", general: "Lamu Old Town Market", maliMali: "Mpeketoni Wholesale Street", produce: "Mpeketoni Market", produceNote: "Maize, cotton, cashews" },
  { county: "Machakos", slug: "machakos", general: "Machakos Kong'a / Tala", maliMali: "Machakos Industrial Area Road", produce: "Tala / Mitaboni Markets", produceNote: "Avocados and citrus" },
  { county: "Makueni", slug: "makueni", general: "Emali Market", maliMali: "Wote Town Market Street", produce: "Emali / Kibwezi Markets", produceNote: "Mangoes and watermelons" },
  { county: "Mandera", slug: "mandera", general: "Mandera Border Market", maliMali: "Mandera Central Suq", produce: "Mandera Central Market", produceNote: "Watermelons and onions" },
  { county: "Marsabit", slug: "marsabit", general: "Marsabit Central Market", maliMali: "Marsabit Central Square shops", produce: "Marsabit Town Market", produceNote: "Livestock, mountain crops" },
  { county: "Meru", slug: "meru", general: "Makutano / Nkubu Markets", maliMali: "Makutano Junction Stalls", produce: "Gakoromone Market", produceNote: "Bananas, potatoes, mangoes" },
  { county: "Migori", slug: "migori", general: "Migori Kehancha Market", maliMali: "Migori Posta Road hubs", produce: "Kehancha Market", produceNote: "Maize, sweet potatoes, tobacco" },
  { county: "Mombasa", slug: "mombasa", general: "Kongowea Market", maliMali: "Kongowea Mali Mali section", produce: "Kongowea Market", produceNote: "Coastal wholesale terminal" },
  { county: "Murang'a", slug: "muranga", general: "Kiria-ini Market", maliMali: "Murang'a Mukuyu Market", produce: "Maragua Market", produceNote: "Bananas, avocados, macadamia" },
  { county: "Nairobi", slug: "nairobi", general: "Gikomba Market", maliMali: "Kamukunji Market", produce: "Wakulima (Marikiti) Market", produceNote: "Produce and cereals wholesale" },
  { county: "Nakuru", slug: "nakuru", general: "Nakuru OTC Market", maliMali: "Nakuru Top Market", produce: "Wakulima Market Nakuru", produceNote: "Carrots, potatoes, cabbage" },
  { county: "Nandi", slug: "nandi", general: "Kapsabet Open-Air Market", maliMali: "Kapsabet Behind-the-Stage strip", produce: "Kapsabet Open-Air Market", produceNote: "Dairy, vegetables, cereals" },
  { county: "Narok", slug: "narok", general: "Narok County Market", maliMali: "Narok Bridge-side Mali Mali", produce: "Mulot / Narok Town Market", produceNote: "Wheat, maize, beef" },
  { county: "Nyamira", slug: "nyamira", general: "Nyamira Town Market", maliMali: "Keroka Town wholesale line", produce: "Keroka / Nyamira Market", produceNote: "Bananas, tea-zone vegetables" },
  { county: "Nyandarua", slug: "nyandarua", general: "Ol Kalou Market", maliMali: "Ol Kalou Main Stage shops", produce: "Ol Kalou / Njabini Market", produceNote: "Potato industry hub" },
  { county: "Nyeri", slug: "nyeri", general: "Karatina Market", maliMali: "Karatina Upper Floor", produce: "Karatina Market", produceNote: "Multi-storey fresh food market" },
  { county: "Samburu", slug: "samburu", general: "Maralal Town Market", maliMali: "Maralal Central shops", produce: "Maralal / Baragoi Markets", produceNote: "Livestock, hides, vegetables" },
  { county: "Siaya", slug: "siaya", general: "Bondo Market", maliMali: "Bondo Stage Lane wholesalers", produce: "Bondo Market", produceNote: "Omena, tilapia, sorghum" },
  { county: "Taita Taveta", slug: "taita-taveta", general: "Taveta Border Market", maliMali: "Voi Town Market Street", produce: "Taveta Border Market", produceNote: "Bananas, onions, tomatoes" },
  { county: "Tana River", slug: "tana-river", general: "Hola Market", maliMali: "Hola Town Center shops", produce: "Hola Market", produceNote: "Cotton, rice, watermelons" },
  { county: "Tharaka-Nithi", slug: "tharaka-nithi", general: "Chuka Open-Air Market", maliMali: "Chuka Lower Market stalls", produce: "Chuka Market", produceNote: "Bananas, yams, grains" },
  { county: "Trans Nzoia", slug: "trans-nzoia", general: "Kitale Municipal Market", maliMali: "Kitale Town Line Tano", produce: "Kitale Municipal Market", produceNote: "Maize basket of Kenya" },
  { county: "Turkana", slug: "turkana", general: "Lodwar Central Market", maliMali: "Lodwar Suq Area", produce: "Lodwar Central Market", produceNote: "River-basin produce" },
  { county: "Uasin Gishu", slug: "uasin-gishu", general: "Eldoret Main Market", maliMali: "Eldoret Mali Mali Section", produce: "Eldoret Main Market", produceNote: "North Rift maize harvest" },
  { county: "Vihiga", slug: "vihiga", general: "Chavakali Market", maliMali: "Chavakali Junction stalls", produce: "Chavakali Market", produceNote: "Sweet potatoes, indigenous veg" },
  { county: "Wajir", slug: "wajir", general: "Wajir Livestock Market", maliMali: "Wajir Orahey Market", produce: "Wajir Livestock Market", produceNote: "Camel milk trade" },
  { county: "West Pokot", slug: "west-pokot", general: "Makutano Market", maliMali: "Kapenguria Makutano stalls", produce: "Makutano Market", produceNote: "Potatoes, onions, cattle" }
];
export const getCounty = (slug: string) => COUNTIES.find((c) => c.slug === slug);
export type Category = { slug: string; name: string; icon: LucideIcon };
export const CATEGORIES: Category[] = [
  { slug: "vegetables", name: "Vegetables & Fruits", icon: Leaf },
  { slug: "cereals", name: "Cereals & Grains", icon: Wheat },
  { slug: "livestock", name: "Livestock & Poultry", icon: Beef },
  { slug: "fish", name: "Fish & Seafood", icon: Fish },
  { slug: "utensils", name: "Utensils & Plastics", icon: UtensilsCrossed },
  { slug: "furniture", name: "Furniture", icon: Armchair },
  { slug: "electronics", name: "Electronics", icon: Smartphone },
  { slug: "clothing", name: "Clothing & Mitumba", icon: Shirt },
  { slug: "hardware", name: "Hardware & Tools", icon: Hammer },
  { slug: "beauty", name: "Beauty & Health", icon: Sparkles },
  { slug: "dairy", name: "Dairy & Eggs", icon: Milk },
  { slug: "other", name: "Other Goods", icon: Package }
];
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? "Other Goods";`,

'src/components/product-card.tsx': `import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { MapPin, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart, formatKes } from "@/lib/cart";
export type ProductRow = { id: string; vendor_id: string; title: string; description: string | null; category_slug: string; price_kes: number; unit: string; stock: number; image_url: string | null; vendors: { shop_name: string; slug: string; county_slug: string; market_name: string } | null };
export function ProductCard({ product }: { product: ProductRow }) {
  const add = () => {
    addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors?.shop_name ?? "Shop", title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url });
    toast.success(product.title + " added to basket");
  };
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-secondary">
          {product.image_url ? <img src={product.image_url} alt={product.title} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><Package className="size-12" /></div>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to="/product/$id" params={{ id: product.id }}><h3 className="line-clamp-2 font-semibold leading-snug">{product.title}</h3></Link>
        {product.vendors && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{product.vendors.shop_name} · {product.vendors.market_name}</p>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <p className="font-display text-lg font-bold">{formatKes(Number(product.price_kes))}<span className="text-xs font-normal text-muted-foreground">/{product.unit}</span></p>
          <Button size="sm" onClick={add} disabled={product.stock <= 0}><Plus className="size-4" />{product.stock <= 0 ? "Sold out" : "Add"}</Button>
        </div>
      </div>
    </div>
  );
}`
};
for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('Created', file);
}
console.log('DONE: professional icons applied');