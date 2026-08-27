import fs from 'fs';

fs.writeFileSync('vercel.json', `{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/product/:id", "destination": "/api/og?id=:id" },
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ]
}
`);
console.log('vercel.json fixed: api routes bypass SPA catch-all');