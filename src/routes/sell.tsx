import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus, MapPin, ListPlus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COUNTIES } from "@/data/markets";
export const Route = createFileRoute("/sell")({ component: Sell });
function Sell() {
  const steps = [
    { icon: UserPlus, t: "Create your account", d: "Sign up with email in under a minute." },
    { icon: MapPin, t: "Pick your market", d: "Choose your county and the market where your stall is." },
    { icon: ListPlus, t: "List your goods", d: "Add photos, prices and stock by category." },
    { icon: ClipboardList, t: "Receive orders", d: "Buyers order online, you confirm and arrange delivery." }
  ];
  return (
    <div>
      <section className="hero-surface">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">Take your stall online — reach buyers in all 47 counties</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">Whether you sell sufurias in Kamukunji, sofas in Kisumu or tomatoes in Karatina, Soko47 puts your goods in front of buyers searching every day.</p>
          <Button asChild size="lg" variant="secondary" className="mt-8"><Link to="/vendor">Open my shop</Link></Button>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-border bg-card p-5">
              <div className="warm-surface flex size-9 items-center justify-center rounded-full font-bold">{i + 1}</div>
              <s.icon className="mt-3 size-5 text-accent-deep" />
              <p className="mt-2 font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-2xl font-bold">Pay what fits your business</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-3xl font-extrabold">KSh 300<span className="text-base font-normal text-muted-foreground">/month</span></p>
            <p className="mt-1 font-medium">Starter</p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>Up to 20 listings</li>
              <li>Shop page with call & WhatsApp buttons</li>
              <li>Orders dashboard</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-accent bg-card p-6">
            <p className="font-display text-3xl font-extrabold">KSh 800<span className="text-base font-normal text-muted-foreground">/month</span></p>
            <p className="mt-1 font-medium">Biashara</p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>Unlimited listings</li>
              <li>Featured placement in your county</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">First 3 weeks free for every new shop. Covering {COUNTIES.length} counties and their biggest markets.</p>
      </section>
    </div>
  );
}