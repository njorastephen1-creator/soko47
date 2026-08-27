import fs from 'fs';
fs.writeFileSync('vercel.json', `{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0"
    }
  },
  "rewrites": [
    { "source": "/product/:id", "destination": "/api/og/:id" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
`);
console.log('vercel.json updated');