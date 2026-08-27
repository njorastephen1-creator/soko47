import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight, MapPin, MessageCircle, Minus, Phone, Play, Plus, ShieldCheck, ShoppingBasket, Store, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoryName, getCounty } from "@/data/markets";
import { addToCart, formatKes } from "@/lib/cart";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/like-button";
import { FollowButton } from "@/components/follow-button";
import { Stars, ratingOf } from "@/components/reviews";
import { ProductCard } from "@/components/product-card";
export const Route = createFileRoute("/product/$id")({ component: ProductPage });
function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function ProductPage() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [playVid, setPlayVid] = useState<string | null>(null);
  const [showDesc, setShowDesc] = useState(false);
  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors!inner(id, user_id, shop_name, slug, county_slug, market_name, phone, whatsapp, pay_phone, till_number, followers_count, status, rating_sum, rating_count)").eq("id", id).maybeSingle();
      return data;
    },
  });
  const { data: more } = useQuery({
    queryKey: ["more-from-shop", product ? product.vendor_id : "none"],
    enabled: !!product,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, vendors(shop_name, slug, county_slug, market_name)").eq("vendor_id", product!.vendor_id).neq("id", product!.id).order("created_at", { ascending: false }).limit(6);
      return data || [];
    },
  });
  if (!product) return <p className="py-16 text-center text-muted-foreground">Loading product...</p>;
  const county = getCounty(product.vendors.county_slug);
  const isVid = (u: string) => /\.mp4(\?|$)|\/videos\//.test(u || "");
  const gallery = ([product.image_url].concat((product.images as string[]) || [])).filter(Boolean) as string[];
  const specs = (product.specs as { label: string; value: string }[]) || [];
  const highlights = (product.highlights as string[]) || [];
  const faqs = (product.faqs as { q: string; a: string }[]) || [];
  const isOwner = !!session && session.user.id === product.vendors.user_id;
  const r = ratingOf(product.vendors);
  const add = () => {
    addToCart({ productId: product.id, vendorId: product.vendor_id, shopName: product.vendors.shop_name, title: product.title, price: Number(product.price_kes), unit: product.unit, imageUrl: product.image_url });
    toast.success(product.title + " added to basket");
  };
  const yid = product.video_url ? ytId(product.video_url) : null;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:pb-8">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link><ChevronRight className="size-3" />
        <Link to="/browse" className="hover:underline">Shop</Link><ChevronRight className="size-3" />
        <Link to="/browse" search={{ category: product.category_slug }} className="hover:underline">{categoryName(product.category_slug)}</Link>
        {product.subcategory ? (<><ChevronRight className="size-3" /><span>{product.subcategory}</span></>) : null}
      </nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            {(() => { const m = gallery[img] && !isVid(gallery[img]) ? gallery[img] : (product.image_url || gallery.find((x: string) => !isVid(x)) || ""); return m ? <img src={m} alt={product.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground"><ShoppingBasket className="size-16" /></div>; })()}
            <LikeButton productId={product.id} likes={Number(product.likes_count || 0)} className="absolute right-3 top-3" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => (isVid(g) ? setPlayVid(g) : setImg(i))} className={"size-16 shrink-0 overflow-hidden rounded-lg border-2 " + (i === img ? "border-accent" : "border-border")}>
                  {isVid(g) ? (<span className="relative flex size-full items-center justify-center bg-black"><video src={g} muted playsInline preload="metadata" className="size-full object-cover opacity-60" /><Play className="absolute size-5 text-white" /></span>) : (<img src={g} alt="" className="size-full object-cover" />)}
                </button>
              ))}
            </div>
          )}
          {playVid ? (
            <div className="mt-3 w-full max-w-[280px] overflow-hidden rounded-xl border border-border bg-black">
              <video src={playVid} controls autoPlay playsInline className="w-full" />
              <button onClick={() => setPlayVid(null)} className="w-full bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground">Close video</button>
            </div>
          ) : null}
        </div>
        <div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={"rounded-full px-3 py-1 font-semibold " + (product.condition === "used" ? "bg-warning/20 text-foreground" : "bg-success/15 text-success")}>{product.condition === "used" ? "Used" : "Brand new"}</span>
            {product.brand ? <span className="rounded-full bg-secondary px-3 py-1 font-medium">{product.brand}</span> : null}
            {product.model ? <span className="rounded-full bg-secondary px-3 py-1 font-medium">{product.model}</span> : null}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">{product.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" /> {product.vendors.market_name} · {county ? county.county : ""}</p>
          {r.count > 0 ? <p className="mt-2 flex items-center gap-2 text-sm"><Stars value={r.avg} /> <span className="text-muted-foreground">{r.avg.toFixed(1)} · {r.count} reviews</span></p> : null}
          <p className="mt-4 font-display text-4xl font-extrabold text-accent-deep">{(Number(product.offer_price_kes) > 0 ? <span className="whitespace-nowrap"><s className="mr-1 opacity-60">{formatKes(Number(product.price_kes))}</s><span className="font-bold text-accent-deep">{formatKes(Number(product.offer_price_kes))}</span></span> : formatKes(Number(product.price_kes)))}<span className="text-sm font-normal text-muted-foreground"> /{product.unit}</span></p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-border">
              <button className="px-3 py-2 hover:bg-secondary" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="less"><Minus className="size-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button className="px-3 py-2 hover:bg-secondary" onClick={() => setQty(qty + 1)} aria-label="more"><Plus className="size-4" /></button>
            </div>
            <Button size="lg" disabled={product.stock <= 0} onClick={add}><ShoppingBasket className="size-5" /> {product.stock <= 0 ? "Sold out" : "Add to basket"}</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{product.stock > 0 ? product.stock + " in stock" : "Out of stock"}</p>
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Store className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <Link to="/shop/$slug" params={{ slug: product.vendors.slug }} className="flex items-center gap-1 font-semibold hover:underline">{product.vendors.shop_name} <BadgeCheck className="size-4 text-accent" /></Link>
                <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">{product.vendors.followers_count ?? 0} followers · {r.count > 0 ? r.count + " ratings" : "verified trader"}</p>
              </div>
              <FollowButton vendorId={product.vendors.id} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.vendors.phone ? <a href={"tel:" + product.vendors.phone} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"><Phone className="size-3.5" /> Call seller</a> : null}
              {product.vendors.whatsapp ? <a href={"https://wa.me/" + product.vendors.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"><MessageCircle className="size-3.5" /> WhatsApp</a> : null}
              {product.vendors.pay_phone ? <button onClick={() => { navigator.clipboard.writeText(product.vendors.pay_phone); toast.success("M-Pesa number copied - pay " + product.vendors.shop_name + " directly"); }} className="flex items-center gap-1 rounded-md border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-deep">💳 M-Pesa: {product.vendors.pay_phone} (tap to copy)</button> : null}
              {session ? <Link to="/chat/$vendorId/$buyerId" params={{ vendorId: product.vendors.id, buyerId: session.user.id }} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"><MessageCircle className="size-3.5" /> Chat</Link> : null}
              {isOwner ? <Link to="/enrich/$id" params={{ id: product.id }} className="flex items-center gap-1 rounded-md border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-deep">Add more info</Link> : null}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-xs text-foreground">
            <ShieldCheck className="size-4 shrink-0 text-warning" />
            <p><strong>Safety tips:</strong> meet in public, inspect before paying, never pay upfront for delivery you did not arrange.</p>
          </div>
        </div>
      </div>
      {product.video_url ? (
        <div className="mt-10">
          {!showVideo ? (
            <button onClick={() => setShowVideo(true)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Play className="size-4" /> Watch product video
            </button>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Product video</h2>
                <button onClick={() => setShowVideo(false)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary">Close video</button>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border bg-black">
                {yid ? <iframe className="aspect-video w-full max-w-sm" src={"https://www.youtube.com/embed/" + yid} title="Product video" allowFullScreen /> : <video controls className="mt-2 max-w-[260px] rounded-xl border border-border" src={product.video_url} />}
              </div>
            </div>
          )}
        </div>
      ) : null}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">About this item</h2>
          {highlights.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {highlights.map((h, i) => (<li key={i}>{h}</li>))}
            </ul>
          ) : null}
          {product.description ? (
            <>
              <p className={"mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground " + (showDesc ? "" : "line-clamp-4")}>{product.description}</p>
              {product.description.length > 180 ? (
                <button onClick={() => setShowDesc(!showDesc)} className="mt-2 text-xs font-semibold text-accent-deep hover:underline">{showDesc ? "Show less" : "Show more"}</button>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">The trader has not added a description yet.</p>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Key details</h2>
          {specs.length > 0 ? (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-medium text-muted-foreground">{s.label}</td>
                    <td className="py-2 font-semibold">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No extra specs yet - the trader can add them anytime.</p>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Truck className="size-4" /> Delivery or pickup arranged with the trader at checkout.</div>
        </div>
      </div>
      {faqs.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">Frequently asked questions</h2>
          <div className="mt-3 space-y-2">
            {faqs.map((f, i) => (
              <details key={i} className="rounded-2xl border border-border bg-card">
                <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-semibold">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold">Q</span>
                  {f.q}
                </summary>
                <div className="flex items-start gap-3 px-4 pb-4 text-sm text-muted-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-foreground">A</span>
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}
      {(more || []).length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">More from {product.vendors.shop_name}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {(more || []).map((p: any) => (<ProductCard key={p.id} product={p} />))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
