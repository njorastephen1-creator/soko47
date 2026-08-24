import fs from 'fs';
const f = 'src/components/video-upload.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('import tusModule from "tus-js-client";\nimport { supabase } from "@/integrations/supabase/client";').join('import { Upload } from "tus-js-client";\nimport { supabase } from "@/integrations/supabase/client";');
c = c.split('const tus: any = (tusModule as any).Upload ? tusModule : ((tusModule as any).default || tusModule);').join('');
c = c.split('const upload = new tus.Upload(file, SUPABASE_URL + "/storage/v1/upload/resumable", {').join('const upload = new Upload(file, SUPABASE_URL + "/storage/v1/upload/resumable", {');
fs.writeFileSync(f, c);
console.log('DONE: fixed tus import');