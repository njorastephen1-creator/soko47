import fs from 'fs';
let chrome = fs.readFileSync('src/components/site-chrome.tsx', 'utf8');
const oldS = 'const fullName = (session ? (session.user_metadata.full_name as string) : "") || (session ? session.user.email : "").split("@")[0] || "trader";';
const newS = 'const fullName = (session && session.user_metadata ? (session.user_metadata.full_name as string) : "") || (session && session.user.email ? session.user.email.split("@")[0] : "") || "trader";';
if (chrome.includes(oldS)) {
  chrome = chrome.split(oldS).join(newS);
  fs.writeFileSync('src/components/site-chrome.tsx', chrome);
  console.log('DONE: safe fullName');
} else console.log('WARNING: line not found');