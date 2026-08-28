import fs from 'fs';
let c = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');

// 1) Expand unitOptions() with more Kenyan market units
const OLD_OPTIONS = `function unitOptions(cat: string): string[] {
  if (cat === "houses") return ["unit", "room", "1/8 acre", "1/4 acre", "acre", "m²"];
  if (cat === "cars") return ["unit"];
  if (SERVICE_CATS.includes(cat)) return ["job", "visit", "hour", "day"];
  return ["piece", "kg", "kiondo", "crate", "dozen", "bag"];
}`;

const NEW_OPTIONS = `function unitOptions(cat: string): string[] {
  if (cat === "houses") return ["unit", "room", "1/8 acre", "1/4 acre", "acre", "m²"];
  if (cat === "cars") return ["unit", "piece"];
  if (SERVICE_CATS.includes(cat)) return ["job", "visit", "hour", "day"];
  return ["piece", "kg", "kiondo", "crate", "dozen", "bag", "sack", "bundle", "bunch", "litre", "bottle", "packet", "box", "tin", "jerrican", "tray"];
}`;

if (!c.includes(OLD_OPTIONS)) { console.log('unitOptions not found'); process.exit(1); }
c = c.split(OLD_OPTIONS).join(NEW_OPTIONS);
console.log('unitOptions expanded');

// 2) Add custom unit input below the chips
const OLD_UNIT_JSX = `          <div><Label>Unit</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {unitOptions(np.category).map((u) => (<button key={u} type="button" onClick={() => setNp({ ...np, unit: u })} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (np.unit === u ? "bg-primary text-primary-foreground" : "bg-secondary")}>{u}</button>))}
            </div>
          </div>`;

const NEW_UNIT_JSX = `          <div><Label>Unit</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {unitOptions(np.category).map((u) => (<button key={u} type="button" onClick={() => setNp({ ...np, unit: u })} className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (np.unit === u ? "bg-primary text-primary-foreground" : "bg-secondary")}>{u}</button>))}
            </div>
            <Input
              value={unitOptions(np.category).includes(np.unit) ? "" : np.unit}
              onChange={(e) => setNp({ ...np, unit: e.target.value })}
              placeholder="Or type custom unit (e.g. wheelbarrow, meter, bucket)"
              className="mt-2"
            />
          </div>`;

if (!c.includes(OLD_UNIT_JSX)) { console.log('Unit JSX not found'); process.exit(1); }
c = c.split(OLD_UNIT_JSX).join(NEW_UNIT_JSX);
console.log('custom unit input added');

fs.writeFileSync('src/routes/_authenticated/vendor.tsx', c);
console.log('\ndone');