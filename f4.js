import fs from 'fs';

// ---- 1) Fix footer with regex ----
let ch = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
const footerRegex = /(<p className="border-t border-white\/10 px-4 py-4 text-center text-xs opacity-70">© 2026 Soko47 · Made in Kenya<\/p>)[\s\S]*?<\/footer>/;
if (!footerRegex.test(ch)) { console.log('FOOTER ANCHOR NOT FOUND'); process.exit(1); }
const newFooter = `<div className="border-t border-white/10 px-4 py-4 text-center text-xs opacity-70">
        <div className="flex flex-wrap justify-center gap-4 pb-2">
          <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
        </div>
        © 2026 Soko47 · Made in Kenya
      </div>
    </footer>`;
ch = ch.replace(footerRegex, newFooter);
fs.writeFileSync('src/components/site-chrome.tsx', ch);
console.log('footer fixed');

// ---- 2) Consent checkbox on auth ----
let au = fs.readFileSync('src/routes/auth.tsx', 'utf8');

if (!au.includes('const [busy, setBusy] = useState(false);')) { console.log('STATE ANCHOR NOT FOUND'); process.exit(1); }
au = au.replace(
  'const [busy, setBusy] = useState(false);',
  'const [busy, setBusy] = useState(false);\n  const [agree, setAgree] = useState(false);'
);

if (!au.includes('const submit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setBusy(true);')) { console.log('SUBMIT ANCHOR NOT FOUND'); process.exit(1); }
au = au.replace(
  'const submit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setBusy(true);',
  'const submit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (mode === "signup" && !agree) { toast.error("Please accept the Terms and Privacy Policy first"); return; }\n    setBusy(true);'
);

if (!au.includes('<Button type="submit" size="lg" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</Button>')) { console.log('SUBMIT BUTTON ANCHOR NOT FOUND'); process.exit(1); }
au = au.replace(
  '<Button type="submit" size="lg" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</Button>',
  `{mode === "signup" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
              <span>I agree to the <Link to="/terms" className="font-medium text-accent-deep underline">Terms & Conditions</Link> and <Link to="/privacy" className="font-medium text-accent-deep underline">Privacy Policy</Link></span>
            </label>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy || (mode === "signup" && !agree)}>{mode === "signin" ? "Sign in" : "Create account"}</Button>`
);

au = au.replace(
  '<Button variant="outline" size="lg" className="w-full" onClick={sendOtp} disabled={busy}>',
  '<Button variant="outline" size="lg" className="w-full" onClick={sendOtp} disabled={busy || (mode === "signup" && !agree)}>'
);
au = au.replace(
  '<Button variant="outline" size="lg" className="w-full" onClick={google}>',
  '<Button variant="outline" size="lg" className="w-full" onClick={google} disabled={busy || (mode === "signup" && !agree)}>'
);

fs.writeFileSync('src/routes/auth.tsx', au);
console.log('consent checkbox added');