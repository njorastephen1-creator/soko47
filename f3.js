import fs from 'fs';

// ---- 1) Fix footer links placement ----
let ch = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
const OLD_FOOTER = `      <p className="border-t border-white/10 px-4 py-4 text-center text-xs opacity-70">© 2026 Soko47 · Made in Kenya</p>
    <div className="mt-6 flex flex-wrap gap-4 text-xs opacity-80"><Link to="/terms">Terms & Conditions</Link><Link to="/privacy">Privacy Policy</Link></div></footer>`;
const NEW_FOOTER = `      <div className="border-t border-white/10 px-4 py-4 text-center text-xs opacity-70">
        <div className="flex flex-wrap justify-center gap-4 pb-2">
          <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
        </div>
        © 2026 Soko47 · Made in Kenya
      </div>
    </footer>`;
if (!ch.includes(OLD_FOOTER)) { console.log('footer anchor not found'); process.exit(1); }
ch = ch.split(OLD_FOOTER).join(NEW_FOOTER);
fs.writeFileSync('src/components/site-chrome.tsx', ch);
console.log('footer links centered + padded');

// ---- 2) Consent checkbox on auth page ----
let au = fs.readFileSync('src/routes/auth.tsx', 'utf8');

// state
const OLD_STATE = 'const [busy, setBusy] = useState(false);';
if (!au.includes(OLD_STATE)) { console.log('auth state anchor not found'); process.exit(1); }
au = au.split(OLD_STATE).join(OLD_STATE + '\n  const [agree, setAgree] = useState(false);');

// guard in submit
const OLD_SUBMIT = '  const submit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setBusy(true);';
if (!au.includes(OLD_SUBMIT)) { console.log('submit anchor not found'); process.exit(1); }
au = au.split(OLD_SUBMIT).join('  const submit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (mode === "signup" && !agree) { toast.error("Please accept the Terms and Privacy Policy first"); return; }\n    setBusy(true);');

// checkbox + disabled submit button
const OLD_BTN = '<Button type="submit" size="lg" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</Button>';
const NEW_BTN = `{mode === "signup" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
              <span>I agree to the <Link to="/terms" className="font-medium text-accent-deep underline">Terms & Conditions</Link> and <Link to="/privacy" className="font-medium text-accent-deep underline">Privacy Policy</Link></span>
            </label>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy || (mode === "signup" && !agree)}>{mode === "signin" ? "Sign in" : "Create account"}</Button>`;
if (!au.includes(OLD_BTN)) { console.log('submit button anchor not found'); process.exit(1); }
au = au.split(OLD_BTN).join(NEW_BTN);

// gate OTP + Google for signup mode too (they also create accounts)
au = au.split('<Button variant="outline" size="lg" className="w-full" onClick={sendOtp} disabled={busy}>').join('<Button variant="outline" size="lg" className="w-full" onClick={sendOtp} disabled={busy || (mode === "signup" && !agree)}>');
au = au.split('<Button variant="outline" size="lg" className="w-full" onClick={google}>').join('<Button variant="outline" size="lg" className="w-full" onClick={google} disabled={busy || (mode === "signup" && !agree)}>');

fs.writeFileSync('src/routes/auth.tsx', au);
console.log('consent checkbox added to sign-up');