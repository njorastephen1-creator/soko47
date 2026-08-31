import fs from 'fs';
let c = fs.readFileSync('src/components/image-upload.tsx', 'utf8');

const OLD = `  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:bg-secondary/70">
      <Upload className="size-4" /> {busy ? "Uploading..." : "Upload photo"}
      <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
    </label>
  );`;

const NEW = `  return (
    <div className="flex items-center gap-3">
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold hover:bg-secondary/70">
        <Upload className="size-4" /> {busy ? "Uploading..." : "Upload photo"}
        <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
      </label>
      {value ? (
        <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          <img src={value} alt="Uploaded photo" className="size-full object-cover" />
        </div>
      ) : null}
    </div>
  );`;

if (!c.includes(OLD)) { console.log('anchor not found'); process.exit(1); }
c = c.split(OLD).join(NEW);
fs.writeFileSync('src/components/image-upload.tsx', c);
console.log('preview thumbnail added');