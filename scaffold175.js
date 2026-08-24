import fs from 'fs';
const f = 'src/routes/social.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.split('queryKey: ["social-posts"], queryFn:').join('queryKey: ["social-posts"], refetchInterval: 20000, queryFn:');
c = c.split('queryKey: ["social-likes"], queryFn:').join('queryKey: ["social-likes"], refetchInterval: 20000, queryFn:');
c = c.split('queryKey: ["social-views"], queryFn:').join('queryKey: ["social-views"], refetchInterval: 20000, queryFn:');
c = c.split('queryKey: ["social-comments"], queryFn:').join('queryKey: ["social-comments"], refetchInterval: 20000, queryFn:');
fs.writeFileSync(f, c);
console.log('DONE: update policy fix (SQL) + 20s auto-refresh');