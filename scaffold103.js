import fs from 'fs';
let vendor = fs.readFileSync('src/routes/_authenticated/vendor.tsx', 'utf8');
if (vendor.includes('onChange={(e) => setRails({ ...rr, s47: e.target.checked })}')) {
  vendor = vendor.split('onChange={(e) => setRails({ ...rr, s47: e.target.checked })}').join('onChange={(e) => { setRails({ ...rr, s47: e.target.checked }); supabase.from("vendors").update({ soko47_pay: e.target.checked }).eq("id", vendor.id).then(() => { qc.invalidateQueries(); toast.success(e.target.checked ? "Soko47 Pay ON - buyers now get auto prompts" : "Soko47 Pay turned off"); }); }}');
  fs.writeFileSync('src/routes/_authenticated/vendor.tsx', vendor);
  console.log('FIXED: Soko47 Pay toggle saves instantly - survives refresh');
}
let chat = fs.readFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', 'utf8');
let n = 0;
if (!chat.includes('fullPhoto')) {
  chat = chat.split('import { createFileRoute } from "@tanstack/react-router";').join('import { createFileRoute, Link } from "@tanstack/react-router";');
  chat = chat.split('  const [showProfile, setShowProfile] = useState(false);').join('  const [showProfile, setShowProfile] = useState(false);\n  const [fullPhoto, setFullPhoto] = useState<string | null>(null);');
  chat = chat.split('{otherPhoto ? <img src={otherPhoto} alt="" onClick={() => setShowProfile(!showProfile)} className="size-10 cursor-pointer rounded-full object-cover" />').join('{otherPhoto ? <img src={otherPhoto} alt="" onClick={(e) => { e.stopPropagation(); setFullPhoto(otherPhoto); }} className="size-10 cursor-pointer rounded-full object-cover" />');
  chat = chat.split('{otherPhoto ? <img src={otherPhoto} alt="" className="size-24 rounded-full object-cover ring-4 ring-accent/20" />').join('{otherPhoto ? <img src={otherPhoto} alt="" onClick={() => setFullPhoto(otherPhoto)} className="size-24 cursor-pointer rounded-full object-cover ring-4 ring-accent/20" />');
  chat = chat.split('{vendor && !iAmVendor ? <a href={"/shop/" + vendor.slug} className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Visit shop</a> : null}').join('{vendor && !iAmVendor ? <a href={"/shop/" + vendor.slug} className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Visit shop</a> : null}\n            <Link to="/profile" className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold">✏️ Edit my profile</Link>');
  chat = chat.split('{m.attachment_url && m.attachment_type === "image" ? <img src={m.attachment_url} alt="" className="mb-1 max-h-64 rounded-lg" /> : null}').join('{m.attachment_url && m.attachment_type === "image" ? <img src={m.attachment_url} alt="" onClick={(e) => { e.stopPropagation(); setFullPhoto(m.attachment_url); }} className="mb-1 max-h-64 cursor-pointer rounded-lg" /> : null}');
  chat = chat.split('\n  );\n}').join(`\n      {fullPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setFullPhoto(null)}>
          <img src={fullPhoto} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"><X className="size-6" /></button>
        </div>
      ) : null}
    </div>
  );
}`);
  n++;
  fs.writeFileSync('src/routes/_authenticated/chat.$vendorId.$buyerId.tsx', chat);
  console.log('Chat: full photo viewer + edit profile button');
}
console.log('DONE:', n);