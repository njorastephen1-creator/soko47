import { createFileRoute, Link } from "@tanstack/react-router";
import { COUNTIES } from "@/data/markets";
export const Route = createFileRoute("/markets/")({ component: MarketsIndex });
function MarketsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-bold md:text-4xl">Kenya's county market directory</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">For every county: the largest general market, the go-to mali mali wholesale hub for household plastics and utensils, and the leading agricultural centre.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {COUNTIES.map((c) => (
          <Link key={c.slug} to="/markets/$county" params={{ county: c.slug }} className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <h2 className="font-display text-xl font-bold">{c.county}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">General</dt><dd>{c.general}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Mali mali</dt><dd>{c.maliMali}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Produce</dt><dd>{c.produce}</dd></div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}