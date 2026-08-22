import fs from 'fs';
const f = 'src/components/product-card.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('line-clamp-1 text-[10px]')) {
  c = c.split('          <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-foreground">{product.title}</p>').join(`          <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-foreground">{product.title}</p>
          {product.description ? <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{product.description}</p> : null}
          <div className="mt-1 flex flex-wrap gap-1">
            {(product as any).condition ? <span className="rounded bg-secondary px-1 py-0.5 text-[9px] font-medium capitalize text-muted-foreground">{(product as any).condition}</span> : null}
            <span className="rounded bg-secondary px-1 py-0.5 text-[9px] font-medium text-muted-foreground">per {product.unit}</span>
            {(product as any).brand ? <span className="rounded bg-secondary px-1 py-0.5 text-[9px] font-medium text-muted-foreground">{(product as any).brand}</span> : null}
          </div>`);
  fs.writeFileSync(f, c);
  console.log('DONE: Jiji-style info preview on cards');
} else console.log('already there');