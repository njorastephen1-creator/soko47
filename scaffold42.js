import fs from 'fs';
let auth = fs.readFileSync('src/routes/auth.tsx', 'utf8');
if (!auth.includes('getSession')) {
  auth = auth.split('import { useState } from "react";').join('import { useEffect, useState } from "react";');
  auth = auth.split('  const navigate = useNavigate();').join(`  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, []);`);
  fs.writeFileSync('src/routes/auth.tsx', auth);
  console.log('DONE: auto-redirect after OAuth');
} else console.log('already present');