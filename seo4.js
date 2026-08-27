import fs from 'fs';

fs.writeFileSync('api/_middleware.ts', `import type { VercelRequest, VercelResponse } from "@vercel/node";

const BOT_USER_AGENTS = [
  "whatsapp",
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "telegrambot",
  "discordbot",
  "googlebot",
  "bingbot",
  "yandex",
  "baiduspider",
];

export default async function middleware(req: VercelRequest, res: VercelResponse, next: () => void) {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  const isBot = BOT_USER_AGENTS.some((b) => ua.includes(b));

  // Check if this is a product or shop page
  const url = req.url || "";
  const productMatch = url.match(/\\/product\\/([a-f0-9-]+)/i);
  const shopMatch = url.match(/\\/shop\\/([^\\/]+)/i);

  if (isBot && productMatch) {
    // Rewrite to OG endpoint
    req.url = "/api/og/" + productMatch[1];
  }

  next();
}
`);
console.log('api/_middleware.ts created');