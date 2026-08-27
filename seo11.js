import fs from 'fs';

fs.writeFileSync('vercel.json', `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@3.0.0"
    }
  },
  "rewrites": [
    { "source": "/product/:id", "destination": "/api/og/:id" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
`);
console.log('vercel.json updated with functions config');