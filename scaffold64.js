import fs from 'fs';
let enrich = fs.readFileSync('src/routes/_authenticated/enrich.$id.tsx', 'utf8');
let n = 0;
if (!enrich.includes('const addPhoto')) {
  enrich = enrich.split('  const save = async () => {').join(`  const persistImages = async (next: string[]) => {
    const { error } = await supabase.from("products").update({ image_url: next[0] || null, images: next.slice(1) }).eq("id", id);
    if (error) { toast.error("Photo save failed: " + error.message); return false; }
    qc.invalidateQueries();
    return true;
  };
  const addPhoto = async (url: string) => {
    const next = [...f.images, url];
    setForm({ ...f, images: next });
    if (await persistImages(next)) toast.success("Photo saved to listing");
  };
  const removePhoto = async (i: number) => {
    const next = f.images.filter((_: string, x: number) => x !== i);
    if (next.length === 0) { toast.error("Keep at least one photo"); return; }
    setForm({ ...f, images: next });
    if (await persistImages(next)) toast.success("Photo removed");
  };
  const save = async () => {`);
  n++;
}
if (enrich.includes('onChange={(url: string) => setForm({ ...f, images: [...f.images, url] })}')) {
  enrich = enrich.split('onChange={(url: string) => setForm({ ...f, images: [...f.images, url] })}').join('onChange={addPhoto}');
  n++;
}
if (enrich.includes('onClick={() => setForm({ ...f, images: f.images.filter((_: string, x: number) => x !== i) })}')) {
  enrich = enrich.split('onClick={() => setForm({ ...f, images: f.images.filter((_: string, x: number) => x !== i) })}').join('onClick={() => removePhoto(i)}');
  n++;
}
if (enrich.includes('Add angles, colors, sizes - all photos stay on the one listing.')) {
  enrich = enrich.split('Add angles, colors, sizes - all photos stay on the one listing.').join('Photos save instantly as you upload - buyers see them right away.');
  n++;
}
if (n > 0) { fs.writeFileSync('src/routes/_authenticated/enrich.$id.tsx', enrich); console.log('DONE:', n, 'patches - instant photo saving'); }
else console.log('WARNING: nothing matched');