import fs from 'fs';
const f = 'src/routes/_authenticated/admin.tsx';
let lines = fs.readFileSync(f, 'utf8').split('\n');

// Drop the broken owner-check block and any duplicate isOwner lines
lines = lines.filter((l) => {
  if (l.includes('owner-check')) return false;               // the ownerCheck useQuery line
  if (/^\s*const isOwner = ownerCheck/.test(l)) return false; // old derived line
  if (/^\s*const isOwner = isAdminEmail/.test(l)) return false; // any prior simple line (we re-add one)
  return true;
});

// Ensure import present
let out = lines.join('\n');
if (!out.includes('import { isAdminEmail } from "@/lib/admin"')) {
  out = out.split('import { useIsAdmin }').join('import { isAdminEmail } from "@/lib/admin";\nimport { useIsAdmin }');
}

// Insert exactly one simple isOwner right after isAdm
if (!out.includes('const isOwner = isAdminEmail')) {
  out = out.split('const isAdm = useIsAdmin(email);').join('const isAdm = useIsAdmin(email);\n  const isOwner = isAdminEmail(email || "");');
}

fs.writeFileSync(f, out);

// Verify no duplicate isOwner
const count = (out.match(/const isOwner =/g) || []).length;
console.log('isOwner declarations:', count);
console.log(count === 1 ? 'FIXED' : 'STILL BROKEN');