import fs from 'fs';
let enrich = fs.readFileSync('src/routes/_authenticated/enrich.$id.tsx', 'utf8');
let changed = false;
if (enrich.includes('  const [uploading, setUploading] = useState(false);\n  const pickVideo')) {
  enrich = enrich.split('  const [uploading, setUploading] = useState(false);\n  const pickVideo').join('  const pickVideo');
  enrich = enrich.split('const [form, setForm] = useState<any>(null);').join('const [form, setForm] = useState<any>(null);\n  const [uploading, setUploading] = useState(false);');
  changed = true;
}
if (changed) { fs.writeFileSync('src/routes/_authenticated/enrich.$id.tsx', enrich); console.log('DONE: hook moved above returns'); }
else console.log('WARNING: pattern not found');